import { apiRequest } from '@/api/apiClient';
import { album, albumWrite, array, category, categoryName, detail, id, metadata, overview, photo, type Category, type Metadata } from './library-data';
const root = '/api/library';
const json = (method: string, value: unknown, signal?: AbortSignal) => ({ method, body: JSON.stringify(value), signal });
export const libraryApi = {
  categories: async (signal?: AbortSignal) => array(await apiRequest(`${root}/categories`, { signal, coalesce: true }), category),
  createCategory: async (name: string, signal?: AbortSignal) => category(await apiRequest(`${root}/categories`, json('POST', { name: categoryName(name) }, signal))),
  renameCategory: async (categoryId: number, name: string, signal?: AbortSignal) => category(await apiRequest(`${root}/categories/${id(categoryId)}`, json('PUT', { name: categoryName(name) }, signal))),
  deleteCategory: async (categoryId: number, signal?: AbortSignal) => { await apiRequest(`${root}/categories/${id(categoryId)}`, { method: 'DELETE', signal }); },
  albums: async (signal?: AbortSignal) => array(await apiRequest(`${root}/albums`, { signal, coalesce: true }), album),
  overview: async (signal?: AbortSignal) => overview(await apiRequest(`${root}/overview`, { signal, coalesce: true })),
  album: async (albumId: number, signal?: AbortSignal) => detail(await apiRequest(`${root}/albums/${id(albumId)}`, { signal, coalesce: true })),
  createAlbum: async (name: string, description: string | null, signal?: AbortSignal) => album(await apiRequest(`${root}/albums`, json('POST', albumWrite(name, description), signal))),
  updateAlbum: async (albumId: number, name: string, description: string | null, signal?: AbortSignal) => album(await apiRequest(`${root}/albums/${id(albumId)}`, json('PUT', albumWrite(name, description), signal))),
  deleteAlbum: async (albumId: number, signal?: AbortSignal) => { await apiRequest(`${root}/albums/${id(albumId)}`, { method: 'DELETE', signal }); },
  updatePhoto: async (photoId: number, input: Metadata, categories: Category[], signal?: AbortSignal) => photo(await apiRequest(`${root}/photos/${id(photoId)}`, json('PUT', metadata(input, categories), signal))),
  deletePhoto: async (photoId: number, signal?: AbortSignal) => { await apiRequest(`${root}/photos/${id(photoId)}`, { method: 'DELETE', signal }); },
  upload: async (albumId: number, body: FormData, signal?: AbortSignal) => array(await apiRequest(`${root}/albums/${id(albumId)}/photos`, { method: 'POST', body, signal }), photo),
};
/** An account-local serial gate. A failed/aborted dispatch must be reconciled before another write. */
export function createLibraryMutations(isCurrentAccount?: () => boolean) {
  let active = false; let epoch = 0; let retryAt = 0; let state = { busy: false, needsReconcile: false }; const listeners = new Set<() => void>();
  const publish = (patch: Partial<typeof state>) => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); };
  const check = (signal: AbortSignal, version: number) => { if (!active || signal.aborted || epoch !== version || isCurrentAccount?.() === false) throw Error('LIBRARY_ACCOUNT_CHANGED'); };
  return {
    subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; }, getSnapshot: () => state,
    setActive: (value: boolean) => { if (active !== value) epoch++; active = value; },
    async reconcile(signal: AbortSignal) { const version = epoch; check(signal, version); const data = await libraryApi.overview(signal); check(signal, version); publish({ needsReconcile: false }); return data; },
    async run<T>(prepare: (signal: AbortSignal) => Promise<() => Promise<T>>, signal: AbortSignal) {
      if (state.busy || state.needsReconcile) throw Error('LIBRARY_RECONCILE');
      if (Date.now() < retryAt) throw Object.assign(Error('LIBRARY_RATE_LIMIT'), { status: 429, retryAfterSeconds: Math.ceil((retryAt - Date.now()) / 1000) });
      const version = epoch; check(signal, version); publish({ busy: true }); let dispatched = false; let acknowledged = false;
      try { const write = await prepare(signal); check(signal, version); dispatched = true; const result = await write(); acknowledged = true; check(signal, version); const data = await libraryApi.overview(signal); check(signal, version); return { result, data }; }
      catch (error) { const status = (error as { status?: number }).status; if (status === 429) retryAt = Date.now() + Math.max(1, (error as { retryAfterSeconds?: number }).retryAfterSeconds ?? 60) * 1000; if (dispatched && (acknowledged || !status || status >= 500)) publish({ needsReconcile: true }); throw error; }
      finally { publish({ busy: false }); }
    },
  };
}
export function assertUnchanged(original: unknown, current: unknown) { if (JSON.stringify(original) !== JSON.stringify(current)) throw Error('LIBRARY_CONFLICT'); }

// Overview and album routes must share their write/uncertainty boundary. Keep
// only flags here, never DTOs, media bytes or credentials. A route unmount must
// not let another screen silently bypass an uncertain dispatched operation.
const accountMutations = new Map<number, ReturnType<typeof createLibraryMutations>>();
let currentMutationAccount: number | undefined;
export function libraryMutationsForAccount(accountId: number) {
  id(accountId);
  if (currentMutationAccount !== accountId) {
    if (currentMutationAccount !== undefined) accountMutations.get(currentMutationAccount)?.setActive(false);
    currentMutationAccount = accountId;
  }
  let mutations = accountMutations.get(accountId);
  if (!mutations) { mutations = createLibraryMutations(() => currentMutationAccount === accountId); accountMutations.set(accountId, mutations); }
  return mutations;
}
