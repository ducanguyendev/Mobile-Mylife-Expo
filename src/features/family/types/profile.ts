import type { FamilyMember } from './family';
export type FamilyTimelineEvent = {
  id: number; memberId: number | null; memberName: string | null; eventType: string; title: string;
  description: string | null; eventDate: string | null; eventYear: number | null; isApproximate: boolean;
  location: string | null; latitude: number | null; longitude: number | null; relatedMemberId: number | null;
  sourceType: string | null; sourceId: number | null; isDerived: boolean;
};
export type ProfileAnniversary = {
  id: number; eventType: string; title: string; originalSolarDate: string | null; nextSolarDate: string;
  daysUntil: number; place: string | null; notes: string | null;
};
export type FamilyMemberProfile = { member: FamilyMember; relatives: FamilyMember[]; timeline: FamilyTimelineEvent[]; anniversaries: ProfileAnniversary[]; libraryMemberLinkAvailable: boolean };
