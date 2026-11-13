import type { FamilyMember } from '@/features/family/types/family';
import { dateParts } from '@/features/timeline/timeline-data';
import {
  requireAnniversaryWrite, validateAnniversaryMember,
  type AnniversaryType, type AnniversaryWrite,
} from './anniversary-data';

export type AnniversaryDraft = { values: AnniversaryWrite; day: string; month: string; year: string };
export function makeAnniversaryDraft(input: AnniversaryWrite): AnniversaryDraft {
  return { values: { ...input }, day: input.lunarDay?.toString() ?? '', month: input.lunarMonth?.toString() ?? '', year: input.lunarYear?.toString() ?? '' };
}
export function switchAnniversaryType(draft: AnniversaryDraft, type: AnniversaryType, members: FamilyMember[]): AnniversaryDraft {
  if (type === draft.values.eventType) return draft;
  const selected = members.find(member => member.id === draft.values.relatedMemberId);
  if (type === 'FAMILY_EVENT') {
    return { values: { ...draft.values, eventType: type, lunarDay: null, lunarMonth: null, lunarYear: null, isLeapMonth: false }, day: '', month: '', year: '' };
  }
  const eligible = selected?.lifeStatus === 'DECEASED' && dateParts(selected.deathDate);
  return { ...draft, values: { ...draft.values, eventType: type, relatedMemberId: eligible ? selected.id : null, originalSolarDate: eligible ? selected.deathDate : draft.values.originalSolarDate } };
}
export function selectAnniversaryMember(draft: AnniversaryDraft, id: number | null, members: FamilyMember[]): AnniversaryDraft {
  const selected = members.find(member => member.id === id);
  if (id !== null && !selected) throw new Error('ANNIVERSARY_MEMBER_MISSING');
  const values = { ...draft.values, relatedMemberId: id };
  if (values.eventType === 'DEATH_ANNIVERSARY') {
    const previous = members.find(member => member.id === draft.values.relatedMemberId);
    if (selected) {
      if (selected.lifeStatus !== 'DECEASED') throw new Error('FAMILY_ANNIVERSARY_MEMBER_NOT_DECEASED');
      if (!dateParts(selected.deathDate)) throw new Error('FAMILY_ANNIVERSARY_MEMBER_DEATH_DATE_REQUIRED');
      values.originalSolarDate = selected.deathDate;
    } else if (previous?.deathDate === values.originalSolarDate) values.originalSolarDate = null;
  }
  return { ...draft, values };
}
export function anniversaryDraftWrite(draft: AnniversaryDraft, members: FamilyMember[]): AnniversaryWrite {
  const number = (value: string) => /^\d{1,4}$/.test(value) ? Number(value) : null;
  const input = requireAnniversaryWrite({ ...draft.values, lunarDay: number(draft.day), lunarMonth: number(draft.month), lunarYear: number(draft.year) });
  validateAnniversaryMember(input, members);
  return input;
}
