import { normalizeName } from '@/features/family/data/member-search';

export const eventTypes = ['BIRTH', 'DEATH', 'MARRIAGE', 'CHILD_BIRTH', 'ADDRESS_CHANGE', 'ANNIVERSARY', 'MEMORY', 'CUSTOM'] as const;
export type EventType = typeof eventTypes[number];
export const creatableTypes: EventType[] = ['CUSTOM', 'MEMORY', 'ADDRESS_CHANGE', 'MARRIAGE'];
export type TimelineEvent = { id: number; memberId: number | null; memberName: string | null; eventType: EventType; title: string; description: string | null; eventDate: string | null; eventYear: number | null; isApproximate: boolean; location: string | null; latitude: number | null; longitude: number | null; relatedMemberId: number | null; sourceType: string | null; sourceId: number | null; isDerived: boolean };
export type TimelineWrite = Omit<TimelineEvent, 'id' | 'memberName' | 'sourceType' | 'sourceId' | 'isDerived'>;
export const filterTypes = { ALL: [], BIRTH: ['BIRTH', 'DEATH'], MARRIAGE: ['MARRIAGE'], FAMILY: ['CUSTOM', 'CHILD_BIRTH'], LOCATION: ['ADDRESS_CHANGE'], MEMORY: ['MEMORY', 'ANNIVERSARY'], OTHER: [] } as const;
export type TimelineFilter = keyof typeof filterTypes;
const invalid = () => new Error('TIMELINE_INVALID_DATA');
export const positiveId = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0;
export const memberIdValid = (v: unknown): v is number => positiveId(v) && v <= 2147483647;
export const validYear = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 9999;
export function dateParts(value: unknown): { year: number; month: number; day: number } | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return validYear(year) && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1] ? { year, month, day } : null;
}
export function coordinatesValid(lat: unknown, lon: unknown): boolean {
  return lat === null && lon === null || typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90 && typeof lon === 'number' && Number.isFinite(lon) && lon >= -180 && lon <= 180;
}
export function eventKey(e: TimelineEvent): string { return e.isDerived ? `derived:${e.sourceType}:${e.sourceId}:${e.eventType}:${e.id}` : `custom:${e.id}`; }
export function writable(e: TimelineEvent): boolean { return !e.isDerived && positiveId(e.id) && e.eventType !== 'BIRTH' && e.eventType !== 'DEATH'; }
export function requireEvent(value: unknown): TimelineEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid();
  const e = value as TimelineEvent;
  if (!Number.isSafeInteger(e.id) || e.id === 0 || !eventTypes.includes(e.eventType) || typeof e.title !== 'string' || !e.title.trim() || typeof e.isDerived !== 'boolean' || typeof e.isApproximate !== 'boolean') throw invalid();
  for (const f of ['memberId', 'relatedMemberId'] as const) if (e[f] !== null && !memberIdValid(e[f])) throw invalid();
  for (const f of ['memberName', 'description', 'location', 'sourceType'] as const) if (e[f] !== null && typeof e[f] !== 'string') throw invalid();
  if (e.sourceId !== null && !positiveId(e.sourceId) || e.eventYear !== null && !validYear(e.eventYear) || e.eventDate !== null && !dateParts(e.eventDate) || !coordinatesValid(e.latitude, e.longitude)) throw invalid();
  if (e.eventDate && e.eventYear !== null && dateParts(e.eventDate)!.year !== e.eventYear) throw invalid();
  if (e.isDerived) {
    if (e.id >= 0 || !positiveId(e.sourceId)) throw invalid();
    if (e.sourceType === 'FAMILY_MEMBER') {
      if (e.memberId !== e.sourceId || !['BIRTH', 'DEATH'].includes(e.eventType) || e.id !== -e.sourceId * 2 - (e.eventType === 'DEATH' ? 1 : 0) || !e.eventDate) throw invalid();
    } else if (e.sourceType !== 'ANNIVERSARY' || e.eventType !== 'ANNIVERSARY' || e.id !== -e.sourceId || !e.eventDate) throw invalid();
  } else if (e.id < 0) throw invalid();
  return { ...e };
}
export function requireEvents(value: unknown): TimelineEvent[] {
  if (!Array.isArray(value)) throw invalid();
  const result = value.map(requireEvent);
  if (new Set(result.map(eventKey)).size !== result.length) throw invalid();
  return result;
}
export function requireWrite(input: TimelineWrite, original?: TimelineEvent): TimelineWrite {
  if (!input || !eventTypes.includes(input.eventType) || (!creatableTypes.includes(input.eventType) && !(original && writable(original) && input.eventType === original.eventType))) throw invalid();
  if (typeof input.title !== 'string' || input.title.trim().length < 2 || input.title.trim().length > 200 || typeof input.isApproximate !== 'boolean') throw invalid();
  for (const field of ['memberId', 'relatedMemberId'] as const) if (input[field] !== null && !memberIdValid(input[field])) throw invalid();
  if (input.eventDate !== null && !dateParts(input.eventDate) || input.eventYear !== null && !validYear(input.eventYear) || !input.eventDate && input.eventYear === null || !coordinatesValid(input.latitude, input.longitude)) throw invalid();
  for (const [field, max] of [['description', 2000], ['location', 500]] as const) if (input[field] !== null && (typeof input[field] !== 'string' || input[field]!.length > max)) throw invalid();
  if (input.eventType === 'MARRIAGE' && input.memberId !== null && input.memberId === input.relatedMemberId) throw new Error('TIMELINE_SAME_MEMBER');
  return { memberId: input.memberId, relatedMemberId: input.relatedMemberId, eventType: input.eventType, title: input.title.trim(), description: input.description?.trim() || null, location: input.location?.trim() || null, eventDate: input.eventDate, eventYear: input.eventDate ? dateParts(input.eventDate)!.year : input.eventYear, isApproximate: input.isApproximate, latitude: input.latitude, longitude: input.longitude };
}
export function eventWrite(e: TimelineEvent): TimelineWrite { const { memberId, relatedMemberId, eventType, title, description, location, eventDate, eventYear, isApproximate, latitude, longitude } = e; return { memberId, relatedMemberId, eventType, title, description, location, eventDate, eventYear, isApproximate, latitude, longitude }; }
export function blankWrite(memberId: number | null = null, eventType: EventType = 'CUSTOM'): TimelineWrite { return { memberId, relatedMemberId: null, eventType, title: '', description: null, location: null, eventDate: null, eventYear: null, isApproximate: false, latitude: null, longitude: null }; }
export function matchesFilter(e: TimelineEvent, filter: TimelineFilter): boolean {
  if (filter === 'ALL') return true;
  const known = Object.values(filterTypes).flat() as readonly string[];
  return filter === 'OTHER' ? !known.includes(e.eventType) : (filterTypes[filter] as readonly string[]).includes(e.eventType);
}
export function defaultType(filter: TimelineFilter): EventType | null { return filter === 'BIRTH' || filter === 'OTHER' ? null : filter === 'MARRIAGE' ? 'MARRIAGE' : filter === 'LOCATION' ? 'ADDRESS_CHANGE' : filter === 'MEMORY' ? 'MEMORY' : 'CUSTOM'; }
export function selectEvents(events: TimelineEvent[], filter: TimelineFilter, search: string, members: Map<number, string>): TimelineEvent[] {
  const q = normalizeName(search);
  return events.filter(e => matchesFilter(e, filter) && (!q || normalizeName([e.title, e.description, e.location, e.memberName, e.memberId ? members.get(e.memberId) : '', e.relatedMemberId ? members.get(e.relatedMemberId) : ''].filter(Boolean).join(' ')).includes(q)));
}
export function groupEvents(events: TimelineEvent[]): { year: number | null; data: TimelineEvent[] }[] {
  const value = (e: TimelineEvent) => e.eventDate ? Number(e.eventDate.replaceAll('-', '')) : e.eventYear ? e.eventYear * 10000 : Infinity;
  const sorted = events.map((event, index) => ({ event, index })).sort((a, b) => value(a.event) - value(b.event) || a.index - b.index);
  const groups = new Map<number | null, TimelineEvent[]>();
  for (const { event } of sorted) { const year = event.eventDate ? dateParts(event.eventDate)!.year : event.eventYear; const rows = groups.get(year) ?? []; rows.push(event); groups.set(year, rows); }
  return [...groups].map(([year, data]) => ({ year, data }));
}
export function assertUnchanged(original: TimelineEvent, latest: TimelineEvent | undefined): void {
  if (!latest) throw new Error('TIMELINE_MISSING');
  if (eventKey(original) !== eventKey(latest) || JSON.stringify(eventWrite(original)) !== JSON.stringify(eventWrite(latest)) || original.sourceType !== latest.sourceType || original.sourceId !== latest.sourceId) throw new Error('TIMELINE_CONFLICT');
}
export type EventDraft = { values: TimelineWrite; mode: 'date' | 'year'; date: string; year: string; latitude: string; longitude: string };
export function makeDraft(values: TimelineWrite): EventDraft { return { values, mode: values.eventDate ? 'date' : 'year', date: values.eventDate ?? '', year: values.eventYear?.toString() ?? '', latitude: values.latitude?.toString() ?? '', longitude: values.longitude?.toString() ?? '' }; }
export function draftWrite(draft: EventDraft, original?: TimelineEvent): TimelineWrite {
  const numeric = (text: string) => { if (!text.trim()) return null; if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text.trim())) throw invalid(); return Number(text.trim().replace(',', '.')); };
  if (draft.mode === 'year' && !/^\d{1,4}$/.test(draft.year)) throw invalid();
  return requireWrite({ ...draft.values, eventDate: draft.mode === 'date' ? draft.date : null, eventYear: draft.mode === 'date' ? dateParts(draft.date)?.year ?? null : Number(draft.year), latitude: numeric(draft.latitude), longitude: numeric(draft.longitude) }, original);
}
