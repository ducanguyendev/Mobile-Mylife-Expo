import type { FamilyMember } from '../types/family';

export type LocationStatus = FamilyMember['locationStatus'];
export type MapMember = Pick<FamilyMember, 'id' | 'fullName' | 'generation' | 'address' | 'latitude' | 'longitude' | 'locationDisplayName' | 'locationSource'> & { status: LocationStatus };
export type MapLocation = { key: string; displayName: string; latitude: number; longitude: number; memberCount: number; members: Pick<MapMember, 'id' | 'fullName' | 'generation'>[] };
export type FamilyMapData = { totalMembers: number; locatedMembers: number; unlocatedMembers: number; pendingGeocodingMembers: number; noAddressMembers: number; failedGeocodingMembers: number; locations: MapLocation[]; members: MapMember[] };
export type Point = { latitude: number; longitude: number };
export type LocationInput = Point & { displayName?: string };
export type RetryResult = { queued: number; skippedManual: number; skippedLocated: number; noAddress: number };
export type MapFilter = 'all' | 'located' | 'unlocated';
const invalid = () => new Error('FAMILY_MAP_INVALID_RESPONSE');
const record = (v: unknown): Record<string, unknown> => { if (!v || typeof v !== 'object' || Array.isArray(v)) throw invalid(); return v as Record<string, unknown>; };
const count = (v: unknown): number => { if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0) throw invalid(); return v; };
export function requireMapId(v: unknown): number { const id = count(v); if (id < 1 || id > 2147483647) throw invalid(); return id; }
const str = (v: unknown): string => { if (typeof v !== 'string') throw invalid(); return v; };
const nullableString = (v: unknown) => v === null ? null : str(v);
export function validPoint(v: Point): boolean { return typeof v.latitude === 'number' && Number.isFinite(v.latitude) && Math.abs(v.latitude) <= 90 && typeof v.longitude === 'number' && Number.isFinite(v.longitude) && Math.abs(v.longitude) <= 180; }
export function requireLocationInput(v: LocationInput): LocationInput {
  if (!validPoint(v) || (v.displayName !== undefined && (typeof v.displayName !== 'string' || v.displayName.length > 500))) throw new Error('FAMILY_MAP_INVALID_POINT');
  return { latitude: v.latitude, longitude: v.longitude, ...(v.displayName?.trim() ? { displayName: v.displayName.trim() } : {}) };
}
function identity(value: unknown) { const r = record(value); const generation = requireMapId(r.generation); const fullName = str(r.fullName); if (!fullName.trim()) throw invalid(); return { id: requireMapId(r.id), fullName, generation }; }
function member(value: unknown): MapMember {
  const r = record(value); const status = str(r.status) as LocationStatus;
  if (!['NO_ADDRESS', 'PENDING', 'LOCATED', 'FAILED', 'UNAVAILABLE'].includes(status) || ![null, 'MANUAL', 'GEOCODED'].includes(r.locationSource as null)) throw invalid();
  const latitude = r.latitude === null ? null : r.latitude as number;
  const longitude = r.longitude === null ? null : r.longitude as number;
  if ((latitude === null) !== (longitude === null) || (latitude !== null && !validPoint({ latitude, longitude: longitude! }))) throw invalid();
  const locationDisplayName = nullableString(r.locationDisplayName);
  if (status === 'LOCATED' && (latitude === null || !locationDisplayName?.trim())) throw invalid();
  return { ...identity(r), status, address: nullableString(r.address), latitude, longitude, locationDisplayName, locationSource: r.locationSource as MapMember['locationSource'] };
}
/** Fail closed on an inconsistent snapshot; never manufacture pins or counts. */
export function requireFamilyMap(value: unknown): FamilyMapData {
  const r = record(value);
  if (!Array.isArray(r.members) || !Array.isArray(r.locations)) throw invalid();
  const members = r.members.map(member); const byId = new Map(members.map(m => [m.id, m]));
  if (byId.size !== members.length) throw invalid();
  const grouped = new Set<number>(); const keys = new Set<string>();
  const locations = r.locations.map(value => {
    const l = record(value); const key = str(l.key); const displayName = str(l.displayName);
    if (!key.trim() || keys.has(key) || !displayName.trim() || !Array.isArray(l.members) || !validPoint(l as Point)) throw invalid();
    keys.add(key); const rows = l.members.map(identity); const memberCount = count(l.memberCount);
    if (!memberCount || memberCount !== rows.length) throw invalid();
    rows.forEach(row => { const m = byId.get(row.id); if (!m || grouped.has(row.id) || m.status !== 'LOCATED' || m.fullName !== row.fullName || m.generation !== row.generation || Math.abs(m.latitude! - Number(l.latitude)) > 0.000011 || Math.abs(m.longitude! - Number(l.longitude)) > 0.000011) throw invalid(); grouped.add(row.id); });
    return { key, displayName, latitude: l.latitude as number, longitude: l.longitude as number, memberCount, members: rows };
  });
  const result = { totalMembers: count(r.totalMembers), locatedMembers: count(r.locatedMembers), unlocatedMembers: count(r.unlocatedMembers), pendingGeocodingMembers: count(r.pendingGeocodingMembers), noAddressMembers: count(r.noAddressMembers), failedGeocodingMembers: count(r.failedGeocodingMembers), members, locations };
  if (result.totalMembers !== members.length || result.locatedMembers !== grouped.size || result.locatedMembers !== members.filter(m => m.status === 'LOCATED').length || result.unlocatedMembers !== members.length - grouped.size) throw invalid();
  for (const [key, status] of [['pendingGeocodingMembers', 'PENDING'], ['noAddressMembers', 'NO_ADDRESS'], ['failedGeocodingMembers', 'FAILED']] as const) if (result[key] !== members.filter(m => m.status === status).length) throw invalid();
  return result;
}
export function requireRetry(value: unknown): RetryResult { const r = record(value); return { queued: count(r.queued), skippedManual: count(r.skippedManual), skippedLocated: count(r.skippedLocated), noAddress: count(r.noAddress) }; }
const search = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
export function exploreMap(data: FamilyMapData, query: string, filter: MapFilter) {
  const q = search(query); const byId = new Map(data.members.map(m => [m.id, m]));
  const matches = (m: MapMember) => search(`${m.fullName} ${m.address ?? ''} ${m.locationDisplayName ?? ''}`).includes(q);
  const locations = filter === 'unlocated' ? [] : data.locations.filter(l => search(l.displayName).includes(q) || l.members.some(m => matches(byId.get(m.id)!)));
  const unlocated = filter === 'located' ? [] : data.members.filter(m => m.status !== 'LOCATED' && matches(m));
  return { locations, unlocated, visibleMembers: locations.reduce((n, l) => n + l.memberCount, 0) + unlocated.length };
}
/** No address-to-coordinate inference. Longitude precedes latitude in native SDK. */
export function mapViewport(points: Point[]) {
  if (!points.length) return { center: [106, 16], zoom: 4 };
  if (points.length === 1) return { center: [points[0].longitude, points[0].latitude], zoom: 12 };
  const latitudes = points.map(p => Math.max(-85, Math.min(85, p.latitude)));
  return { ne: [Math.max(...points.map(p => p.longitude)), Math.max(...latitudes)], sw: [Math.min(...points.map(p => p.longitude)), Math.min(...latitudes)] };
}
export function nextMapPoll(pending: number, attempts: number): number | null { return pending > 0 && attempts < 6 ? Math.min(60000, 15000 * 2 ** attempts) : null; }
export class LocationConflict extends Error { constructor() { super('FAMILY_MAP_LOCATION_CONFLICT'); } }
export function assertLocationUnchanged(original: FamilyMember, latest: FamilyMember) {
  if (['id', 'fullName', 'address', 'latitude', 'longitude', 'locationDisplayName', 'locationSource', 'locationStatus'].some(key => original[key as keyof FamilyMember] !== latest[key as keyof FamilyMember])) throw new LocationConflict();
}
