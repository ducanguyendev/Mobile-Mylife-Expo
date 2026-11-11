import { familyApi } from './familyApi';
import type { FamilyMember } from '../types/family';
import type { FamilyMemberProfile } from '../types/profile';
const invalid = () => new Error('FAMILY_INVALID_RESPONSE');
const positiveId = (value: unknown) => Number.isSafeInteger(value) && Number(value) > 0;
export function requireMember(value: unknown): FamilyMember {
  if (!value || typeof value !== 'object') throw invalid();
  const row = value as FamilyMember;
  if (!positiveId(row.id) || typeof row.fullName !== 'string' || !Number.isInteger(row.generation) || row.generation < 1
    || !['LIVING', 'DECEASED'].includes(row.lifeStatus) || !Array.isArray(row.childIds) || row.childIds.some(id => !positiveId(id))
    || !Array.isArray(row.horizontalRelations) || row.horizontalRelations.some(relation => !relation || !positiveId(relation.memberId) || typeof relation.relationType !== 'string' || !relation.relationType.trim())) throw invalid();
  for (const field of ['fatherId', 'motherId', 'spouseId'] as const) if (row[field] !== null && !positiveId(row[field])) throw invalid();
  for (const field of ['gender', 'dateOfBirth', 'deathDate', 'role', 'address', 'phoneNumber', 'facebookUrl', 'instagramUrl', 'biography'] as const) {
    if (row[field] !== null && typeof row[field] !== 'string') throw invalid();
  }
  if (typeof row.hasManagedAvatar !== 'boolean' || !Array.isArray(row.childNames) || row.childNames.some(name => typeof name !== 'string')
    || typeof row.createdAt !== 'string' || !Number.isFinite(Date.parse(row.createdAt)) || typeof row.updatedAt !== 'string' || !Number.isFinite(Date.parse(row.updatedAt))) throw invalid();
  for (const field of ['avatarUrl', 'fatherName', 'motherName', 'spouseName', 'locationDisplayName'] as const) if (row[field] !== null && typeof row[field] !== 'string') throw invalid();
  for (const field of ['latitude', 'longitude'] as const) if (row[field] !== null && (typeof row[field] !== 'number' || !Number.isFinite(row[field]))) throw invalid();
  return row;
}
export function requireMembers(value: unknown): FamilyMember[] {
  if (!Array.isArray(value)) throw invalid();
  const rows = value.map(requireMember);
  if (new Set(rows.map(row => row.id)).size !== rows.length) throw invalid();
  return rows;
}
export function requireProfile(value: unknown, memberId: number): FamilyMemberProfile {
  const profile = value as FamilyMemberProfile;
  if (!profile || requireMember(profile.member).id !== memberId || !Array.isArray(profile.timeline) || !Array.isArray(profile.anniversaries) || typeof profile.libraryMemberLinkAvailable !== 'boolean') throw invalid();
  requireMembers(profile.relatives);
  if (profile.timeline.some(event => !event || !Number.isSafeInteger(event.id) || typeof event.title !== 'string' || typeof event.eventType !== 'string' || typeof event.isDerived !== 'boolean' || typeof event.isApproximate !== 'boolean' || (event.eventDate !== null && typeof event.eventDate !== 'string'))
    || profile.anniversaries.some(event => !event || !positiveId(event.id) || typeof event.title !== 'string' || typeof event.nextSolarDate !== 'string' || typeof event.eventType !== 'string' || !Number.isInteger(event.daysUntil))) throw invalid();
  return profile;
}
export const familyDataApi = {
  list: async (signal?: AbortSignal) => requireMembers(await familyApi.list(signal)),
  get: async (id: number, signal?: AbortSignal) => requireMember(await familyApi.get(id, signal)),
  profile: async (id: number, signal?: AbortSignal) => requireProfile(await familyApi.profile(id, signal), id),
};
