import type { FamilyMember } from '../types/family';
export const normalizeName = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').trim().toLowerCase();
export function normalizeGender(value?: string | null): 'male' | 'female' | 'other' | 'unknown' {
  const key = (value ?? '').trim().toLowerCase();
  return ['nam', 'male'].includes(key) ? 'male' : ['nữ', 'female'].includes(key) ? 'female' : ['khác', 'other'].includes(key) ? 'other' : 'unknown';
}
export type MemberFilters = { query: string; generation: string; lifeStatus: string; gender: string };
export const emptyFilters: MemberFilters = { query: '', generation: 'all', lifeStatus: 'all', gender: 'all' };
export function filterMembers(members: readonly FamilyMember[], filters: MemberFilters): FamilyMember[] {
  const query = normalizeName(filters.query);
  return members.filter(member => (!query || normalizeName(member.fullName).includes(query))
    && (filters.generation === 'all' || String(member.generation) === filters.generation)
    && (filters.lifeStatus === 'all' || member.lifeStatus === filters.lifeStatus)
    && (filters.gender === 'all' || normalizeGender(member.gender) === filters.gender));
}
export function sharedParentSiblings(member: FamilyMember, relatives: readonly FamilyMember[]) {
  return relatives.filter(other => other.id !== member.id && ((member.fatherId != null && member.fatherId === other.fatherId) || (member.motherId != null && member.motherId === other.motherId)));
}
export function safeSocialUrl(value: string | null): string | null {
  try { const url = new URL(value ?? ''); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function phoneUrl(value: string | null): string | null {
  if (!value || !/^\+?[\d\s().-]{3,20}$/.test(value)) return null;
  const digits = value.replace(/[\s().-]/g, '');
  return /^\+?\d{3,20}$/.test(digits) ? `tel:${digits}` : null;
}
