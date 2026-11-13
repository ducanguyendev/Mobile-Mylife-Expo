import { normalizeName } from '@/features/family/data/member-search';
import type { FamilyMember } from '@/features/family/types/family';
import { dateParts, memberIdValid, positiveId } from '@/features/timeline/timeline-data';

export type AnniversaryType = 'DEATH_ANNIVERSARY' | 'FAMILY_EVENT';
export type Anniversary = {
  id: number;
  eventType: AnniversaryType;
  title: string;
  relatedMemberId: number | null;
  relatedMemberName: string | null;
  relatedMemberGeneration: number | null;
  relatedMemberRole: string | null;
  lunarDay: number | null;
  lunarMonth: number | null;
  isLeapMonth: boolean;
  originalSolarDate: string | null;
  lunarYear: number | null;
  nextLunarYear: number | null;
  nextSolarDate: string;
  daysUntil: number;
  place: string | null;
  host: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
export type AnniversaryWrite = Pick<Anniversary, 'eventType' | 'title' | 'relatedMemberId' | 'lunarDay' | 'lunarMonth' | 'isLeapMonth' | 'originalSolarDate' | 'lunarYear' | 'place' | 'host' | 'notes'>;
export type LunarInput = { day: number; month: number; year: number; isLeapMonth: boolean };
export type Conversion = { lunarDay: number; lunarMonth: number; lunarYear: number; isLeapMonth: boolean; solarDate: string };
export type Occurrence = { lunarDay: number; lunarMonth: number; isLeapMonth: boolean; nextLunarYear: number; nextSolarDate: string; daysUntil: number; solarYear: number; isCurrentYearPassed: boolean };
export type AnniversaryFilter = 'ALL' | AnniversaryType;

const invalid = () => new Error('ANNIVERSARY_INVALID_DATA');
export const lunarYearValid = (year: unknown): year is number => Number.isInteger(year) && (year as number) >= 1800 && (year as number) <= 2200;
const integerBetween = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
export function lunarPartsValid(day: unknown, month: unknown): boolean {
  return integerBetween(day, 1, 30) && integerBetween(month, 1, 12);
}
function timestampValid(value: unknown): value is string {
  return typeof value === 'string' && dateParts(value.slice(0, 10)) !== null
    && /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,7})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/.test(value);
}
export function requireAnniversary(value: unknown): Anniversary {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid();
  const item = value as Anniversary;
  if (!positiveId(item.id) || !['DEATH_ANNIVERSARY', 'FAMILY_EVENT'].includes(item.eventType)
    || typeof item.title !== 'string' || !item.title.trim() || typeof item.isLeapMonth !== 'boolean'
    || !dateParts(item.nextSolarDate) || !integerBetween(item.daysUntil, 0, 2147483647)
    || !timestampValid(item.createdAt) || !timestampValid(item.updatedAt)) throw invalid();
  if (item.relatedMemberId !== null && !memberIdValid(item.relatedMemberId)) throw invalid();
  if (item.relatedMemberGeneration !== null && !integerBetween(item.relatedMemberGeneration, 1, 2147483647)) throw invalid();
  for (const key of ['relatedMemberName', 'relatedMemberRole', 'place', 'host', 'notes'] as const) {
    if (item[key] !== null && typeof item[key] !== 'string') throw invalid();
  }
  if (item.relatedMemberId === null && [item.relatedMemberName, item.relatedMemberRole, item.relatedMemberGeneration].some(v => v !== null)) throw invalid();
  if (item.originalSolarDate !== null && !dateParts(item.originalSolarDate)) throw invalid();
  if (item.lunarYear !== null && !lunarYearValid(item.lunarYear)) throw invalid();
  if (item.nextLunarYear !== null && !lunarYearValid(item.nextLunarYear)) throw invalid();
  const noLunarParts = item.lunarDay === null && item.lunarMonth === null;
  if (!noLunarParts && !lunarPartsValid(item.lunarDay, item.lunarMonth)) throw invalid();
  if (item.eventType === 'DEATH_ANNIVERSARY') {
    if (noLunarParts || item.nextLunarYear === null) throw invalid();
  } else {
    if (item.nextLunarYear !== null || !item.originalSolarDate && noLunarParts) throw invalid();
  }
  if (noLunarParts && (item.isLeapMonth || item.lunarYear !== null)) throw invalid();
  return { ...item };
}
export function requireAnniversaries(value: unknown): Anniversary[] {
  if (!Array.isArray(value)) throw invalid();
  const items = value.map(requireAnniversary);
  if (new Set(items.map(item => item.id)).size !== items.length) throw invalid();
  return items;
}
export function requireConversion(value: unknown, input: LunarInput): Conversion {
  if (!value || typeof value !== 'object') throw invalid();
  const result = value as Conversion;
  if (result.lunarDay !== input.day || result.lunarMonth !== input.month || result.lunarYear !== input.year
    || result.isLeapMonth !== input.isLeapMonth || !dateParts(result.solarDate)) throw invalid();
  return { ...result };
}
export function requireOccurrence(value: unknown, input: Pick<LunarInput, 'day' | 'month' | 'isLeapMonth'>): Occurrence {
  if (!value || typeof value !== 'object') throw invalid();
  const result = value as Occurrence;
  if (result.lunarDay !== input.day || result.lunarMonth !== input.month || result.isLeapMonth !== input.isLeapMonth
    || !lunarYearValid(result.nextLunarYear) || !dateParts(result.nextSolarDate)
    || result.solarYear !== dateParts(result.nextSolarDate)!.year || !integerBetween(result.daysUntil, 0, 2147483647)
    || typeof result.isCurrentYearPassed !== 'boolean') throw invalid();
  return { ...result };
}
export function anniversaryWrite(item: Anniversary): AnniversaryWrite {
  const { eventType, title, relatedMemberId, lunarDay, lunarMonth, isLeapMonth, originalSolarDate, lunarYear, place, host, notes } = item;
  return { eventType, title, relatedMemberId, lunarDay, lunarMonth, isLeapMonth, originalSolarDate, lunarYear, place, host, notes };
}
export function blankAnniversary(memberId: number | null = null): AnniversaryWrite {
  return { eventType: 'FAMILY_EVENT', title: '', relatedMemberId: memberId, lunarDay: null, lunarMonth: null, isLeapMonth: false, originalSolarDate: null, lunarYear: null, place: null, host: null, notes: null };
}
export function requireAnniversaryWrite(input: AnniversaryWrite): AnniversaryWrite {
  if (!input || !['DEATH_ANNIVERSARY', 'FAMILY_EVENT'].includes(input.eventType)) throw new Error('FAMILY_ANNIVERSARY_INVALID_EVENT_TYPE');
  if (typeof input.title !== 'string' || input.title.trim().length < 2 || input.title.trim().length > 200) throw new Error('FAMILY_ANNIVERSARY_INVALID_TITLE');
  if (!dateParts(input.originalSolarDate)) throw new Error('FAMILY_ANNIVERSARY_ORIGINAL_DATE_REQUIRED');
  if (input.relatedMemberId !== null && !memberIdValid(input.relatedMemberId)) throw invalid();
  if (typeof input.isLeapMonth !== 'boolean') throw invalid();
  for (const [key, max] of [['place', 500], ['host', 300], ['notes', 2000]] as const) {
    if (input[key] !== null && (typeof input[key] !== 'string' || input[key]!.trim().length > max)) throw new Error(`FAMILY_ANNIVERSARY_INVALID_${key.toUpperCase()}`);
  }
  const death = input.eventType === 'DEATH_ANNIVERSARY';
  if (death && (!lunarPartsValid(input.lunarDay, input.lunarMonth) || !lunarYearValid(input.lunarYear))) throw new Error('FAMILY_ANNIVERSARY_INVALID_LUNAR_DATE');
  return {
    eventType: input.eventType, title: input.title.trim(), relatedMemberId: input.relatedMemberId,
    lunarDay: death ? input.lunarDay : null,
    lunarMonth: death ? input.lunarMonth : null, isLeapMonth: death && input.isLeapMonth,
    originalSolarDate: input.originalSolarDate, lunarYear: death ? input.lunarYear : null, place: input.place?.trim() || null,
    host: input.host?.trim() || null, notes: input.notes?.trim() || null,
  };
}
export function validateAnniversaryMember(input: AnniversaryWrite, members: FamilyMember[]): void {
  if (input.relatedMemberId === null) return;
  const member = members.find(m => m.id === input.relatedMemberId);
  if (!member) throw new Error('ANNIVERSARY_MEMBER_MISSING');
  if (input.eventType !== 'DEATH_ANNIVERSARY') return;
  if (member.lifeStatus !== 'DECEASED') throw new Error('FAMILY_ANNIVERSARY_MEMBER_NOT_DECEASED');
  if (!dateParts(member.deathDate)) throw new Error('FAMILY_ANNIVERSARY_MEMBER_DEATH_DATE_REQUIRED');
  if (input.originalSolarDate !== member.deathDate) throw new Error('FAMILY_ANNIVERSARY_DEATH_DATE_MISMATCH');
}
export function eligibleAnniversaryMembers(members: FamilyMember[], type: AnniversaryType): FamilyMember[] {
  return type === 'FAMILY_EVENT' ? members : members.filter(m => m.lifeStatus === 'DECEASED' && dateParts(m.deathDate));
}
export function selectAnniversaries(items: Anniversary[], type: AnniversaryFilter, search: string, date: string | null): Anniversary[] {
  const query = normalizeName(search);
  return items.filter(item => (type === 'ALL' || item.eventType === type) && (!date || item.nextSolarDate === date)
    && (!query || normalizeName([item.title, item.relatedMemberName, item.place, item.host, item.notes].filter(Boolean).join(' ')).includes(query)))
    .sort((a, b) => a.daysUntil - b.daysUntil || a.id - b.id);
}
export function assertAnniversaryUnchanged(original: Anniversary, latest: Anniversary): void {
  if (original.id !== latest.id || original.updatedAt !== latest.updatedAt
    || JSON.stringify(anniversaryWrite(original)) !== JSON.stringify(anniversaryWrite(latest))) throw new Error('ANNIVERSARY_STALE');
}
export function canChi(year: number): string | null {
  if (!lunarYearValid(year)) return null;
  const stems = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
  const branches = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
  return `${year} – ${stems[(year + 6) % 10]} ${branches[(year + 8) % 12]}`;
}
