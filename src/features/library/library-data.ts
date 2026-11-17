export type Category = { id: number; name: string; slug: string; isDefault: boolean };
export type Album = { id: number; name: string; description: string | null; photoCount: number; coverPhotoUrl: string | null; coverPhotoId: number | null; createdAt: string; updatedAt: string };
export type Photo = { id: number; url: string; fileName: string; contentType: string; fileSize: number; caption: string | null; sortOrder: number; takenAt: string | null; createdAt: string; title: string | null; category: string; displayDate: string | null; author: string | null; driveFileId: string };
export type AlbumDetail = Album & { photos: Photo[] };
export type Overview = { categories: Category[]; albums: AlbumDetail[] };
export type Metadata = { title: string | null; category: string | null; displayDate: string | null; description: string | null; author: string | null };
export const maxPhotoBytes = 5 * 1024 * 1024;
export const mimeExtensions: Record<string, string[]> = { 'image/jpeg': ['jpg', 'jpeg'], 'image/png': ['png'], 'image/webp': ['webp'], 'image/gif': ['gif'] };
export function id(value: unknown): number { if (!Number.isSafeInteger(value) || (value as number) <= 0) throw Error('LIBRARY_INVALID_DATA'); return value as number; }
function object(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('LIBRARY_INVALID_DATA'); return value as Record<string, unknown>; }
function text(value: unknown, max = 10000): string { if (typeof value !== 'string' || value.length > max) throw Error('LIBRARY_INVALID_DATA'); return value; }
function nullable(value: unknown, max?: number): string | null { return value === null ? null : text(value, max); }
function integer(value: unknown, min = 0): number { if (!Number.isSafeInteger(value) || (value as number) < min) throw Error('LIBRARY_INVALID_DATA'); return value as number; }
function timestamp(value: unknown): string { const s = text(value, 100); const date = /^(\d{4})-(\d\d)-(\d\d)T\d\d:\d\d:\d\d(?:\.\d{1,7})?(?:Z|[+-]\d\d:\d\d)?$/.exec(s); if (!date || !validDisplayDate(`${date[3]}/${date[2]}/${date[1]}`, '9999-12-31') || !Number.isFinite(Date.parse(s))) throw Error('LIBRARY_INVALID_DATA'); return s; }
export function unique<T extends { id: number }>(items: T[]): T[] { if (new Set(items.map(x => x.id)).size !== items.length) throw Error('LIBRARY_INVALID_DATA'); return items; }
export function array<T extends { id: number }>(value: unknown, read: (v: unknown) => T): T[] { if (!Array.isArray(value)) throw Error('LIBRARY_INVALID_DATA'); return unique(value.map(read)); }
export function category(value: unknown): Category { const v = object(value); const slug = text(v.slug, 64); if (!slug || slug === 'all' || slug.startsWith('__') || typeof v.isDefault !== 'boolean') throw Error('LIBRARY_INVALID_DATA'); return { id: id(v.id), name: text(v.name, 100), slug, isDefault: v.isDefault }; }
export function album(value: unknown): Album { const v = object(value); return { id: id(v.id), name: text(v.name, 150), description: nullable(v.description, 2000), photoCount: integer(v.photoCount), coverPhotoUrl: nullable(v.coverPhotoUrl), coverPhotoId: v.coverPhotoId === null ? null : id(v.coverPhotoId), createdAt: timestamp(v.createdAt), updatedAt: timestamp(v.updatedAt) }; }
export function photo(value: unknown): Photo { const v = object(value); const mime = text(v.contentType, 100); if (!Object.hasOwn(mimeExtensions, mime)) throw Error('LIBRARY_INVALID_DATA'); const size = integer(v.fileSize, 1); if (size > maxPhotoBytes) throw Error('LIBRARY_INVALID_DATA'); const displayDate = nullable(v.displayDate, 100); if (displayDate && !validDisplayDate(displayDate, '9999-12-31')) throw Error('LIBRARY_INVALID_DATA'); return { id: id(v.id), url: text(v.url), fileName: text(v.fileName, 255), contentType: mime, fileSize: size, caption: nullable(v.caption, 2000), sortOrder: integer(v.sortOrder), takenAt: v.takenAt === null ? null : timestamp(v.takenAt), createdAt: timestamp(v.createdAt), title: nullable(v.title, 200), category: text(v.category, 64), displayDate, author: nullable(v.author, 200), driveFileId: text(v.driveFileId) }; }
export function detail(value: unknown): AlbumDetail { const v = object(value); const a = album(v); const photos = array(v.photos, photo); if (photos.length !== a.photoCount || a.coverPhotoId !== null && !photos.some(p => p.id === a.coverPhotoId)) throw Error('LIBRARY_INVALID_DATA'); return { ...a, photos }; }
export function overview(value: unknown): Overview { const v = object(value); const albums = array(v.albums, detail); unique(albums.flatMap(a => a.photos)); const categories = array(v.categories, category); if (new Set(categories.map(c => c.slug)).size !== categories.length) throw Error('LIBRARY_INVALID_DATA'); return { categories, albums }; }
export function validDisplayDate(value: string | null, today = new Date().toISOString().slice(0, 10)): boolean {
  if (!value?.trim()) return true;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim()); if (!match) return false;
  const [, d, m, y] = match; const key = `${y}-${m}-${d}`; const date = new Date(`${key}T00:00:00Z`);
  return Number(y) >= 1 && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === key && key <= today;
}
export function albumWrite(name: string, description: string | null) { if (!name.trim() || name.length > 150 || description && description.length > 2000) throw Error('LIBRARY_INVALID_METADATA'); return { name: name.trim(), description: description?.trim() || null }; }
export function categoryName(name: string) { if (!name.trim() || name.length > 100) throw Error('LIBRARY_INVALID_METADATA'); return name.trim(); }
export function metadata(input: Metadata, categories: Category[]): Metadata {
  for (const [key, max] of [['title', 200], ['description', 2000], ['author', 200]] as const) if (input[key] !== null && (typeof input[key] !== 'string' || input[key]!.length > max)) throw Error('LIBRARY_INVALID_METADATA');
  if (!validDisplayDate(input.displayDate) || input.category !== null && !categories.some(c => c.slug === input.category)) throw Error('LIBRARY_INVALID_METADATA');
  return { title: input.title?.trim() || null, description: input.description?.trim() || null, author: input.author?.trim() || null, displayDate: input.displayDate?.trim() || null, category: input.category };
}
export function photoMetadata(p: Photo): Metadata { return { title: p.title, description: p.caption, author: p.author, displayDate: p.displayDate, category: p.category === '__album__' ? null : p.category }; }
export const blankMetadata = (): Metadata => ({ title: null, description: null, author: null, displayDate: null, category: null });
export const normalizeSearch = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const photoSearchText = new WeakMap<Photo, string>();
export function selectPhotos(photos: Photo[], search: string, slug: string | null) {
  const q = normalizeSearch(search.trim());
  return photos.filter(p => {
    if (slug && p.category !== slug) return false;
    if (!q) return true;
    let text = photoSearchText.get(p);
    if (text === undefined) { text = normalizeSearch([p.title, p.caption, p.author, p.fileName, p.displayDate].join(' ')); photoSearchText.set(p, text); }
    return text.includes(q);
  });
}
export function nextPhoto(photos: Photo[], current: number, delta: number) { if (!photos.length) return null; const index = photos.findIndex(p => p.id === current); return photos[Math.max(0, Math.min(photos.length - 1, index + delta))] ?? null; }
