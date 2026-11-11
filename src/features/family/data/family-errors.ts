import type { FamilyStrings } from '../i18n/familyStrings';
import { MemberConflict } from './member-edit';
import type { FormErrors } from '../validation/familyValidation';
export function familyError(error: unknown, copy: FamilyStrings): string {
  if (error instanceof MemberConflict) return copy.conflict;
  const value = error as { code?: string; status?: number; kind?: string } | null;
  const codes: Record<string, string> = {
    FAMILY_SELF_RELATION: copy.selfRelation, FAMILY_PARENTS_MUST_DIFFER: copy.parentsDiffer,
    FAMILY_RELATED_MEMBER_NOT_FOUND: copy.foreignRelation, FAMILY_RELATIONSHIP_CYCLE: copy.cycle,
    FAMILY_SPOUSE_IN_USE: copy.spouseInUse, FAMILY_RELATIONSHIP_INVALID: copy.invalidRelation,
    FAMILY_MEMBER_DEATH_DATE_REQUIRED: copy.deathRequired, FAMILY_MEMBER_DEATH_DATE_FUTURE: copy.deathFuture,
    FAMILY_MEMBER_DEATH_BEFORE_BIRTH: copy.deathBeforeBirth, FAMILY_AVATAR_INVALID: copy.avatarInvalid,
    FAMILY_AVATAR_STORAGE_FAILED: copy.avatarFailure, MEMBER_AVATAR_UPSTREAM_FAILED: copy.avatarLoadFailure,
  };
  if (value?.code && codes[value.code]) return codes[value.code];
  if (value?.status === 401) return copy.sessionExpired;
  if (value?.status === 403) return copy.forbidden;
  if (value?.status === 404) return copy.notFound;
  if (value?.kind === 'network') return copy.network;
  if ((value?.status ?? 0) >= 500) return copy.serverError;
  return copy.error;
}
export function localizedFieldErrors(error: unknown, copy: FamilyStrings): FormErrors {
  const result: FormErrors = {};
  const fields: Record<string, keyof FormErrors> = { fullname: 'fullName', generation: 'generation', gender: 'gender', dateofbirth: 'dateOfBirth', deathdate: 'deathDate', role: 'role', address: 'address', phonenumber: 'phoneNumber', facebookurl: 'facebookUrl', instagramurl: 'instagramUrl', fatherid: 'fatherId', motherid: 'motherId', spouseid: 'spouseId', childids: 'childIds', horizontalrelations: 'form' };
  for (const field of Object.keys((error as { fieldErrors?: object })?.fieldErrors ?? {})) {
    const key = fields[field.toLowerCase()]; if (key) result[key] = copy.invalidField;
  }
  return result;
}
