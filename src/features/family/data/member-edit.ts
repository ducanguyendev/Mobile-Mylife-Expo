import type { FamilyMember, FamilyMemberWriteInput, HorizontalRelation } from '../types/family';
import { memberToFormValues, toFamilyInput, validDateOnly, vietnamDateString, type FormValues, type FormErrors } from '../validation/familyValidation';
import type { FamilyStrings } from '../i18n/familyStrings';

export const emptyMemberValues: FormValues = { fullName: '', generation: '1', gender: '', dateOfBirth: '', lifeStatus: 'LIVING', deathDate: '', role: '', address: '', phoneNumber: '', facebookUrl: '', instagramUrl: '', biography: '', fatherId: '', motherId: '', spouseId: '', childIds: [] };
export class MemberConflict extends Error { constructor() { super('FAMILY_EDIT_CONFLICT'); } }
const relationKey = (relation: HorizontalRelation) => `${relation.memberId}:${relation.relationType.trim().toLowerCase()}`;
const equalSet = <T,>(a: readonly T[], b: readonly T[], key: (item: T) => string) => {
  const x = new Set(a.map(key)); const y = new Set(b.map(key));
  return x.size === y.size && [...x].every(value => y.has(value));
};
export function mergeSelection<T>(original: readonly T[], selected: readonly T[], latest: readonly T[], key: (item: T) => string): T[] {
  const desired = new Set(selected.map(key)); const old = new Set(original.map(key));
  const removed = new Set([...old].filter(value => !desired.has(value)));
  const merged = new Map(latest.filter(item => !removed.has(key(item))).map(item => [key(item), item]));
  selected.filter(item => !old.has(key(item))).forEach(item => merged.set(key(item), item));
  return [...merged.values()];
}
export function hasMemberChanges(original: FormValues, values: FormValues, originalRelations: HorizontalRelation[], relations: HorizontalRelation[]) {
  return (Object.keys(original) as (keyof FormValues)[]).some(key => key === 'childIds' ? !equalSet(original.childIds, values.childIds, String) : original[key] !== values[key])
    || !equalSet(originalRelations, relations, relationKey);
}
/** Full PUT of fresh server values, with only intentional local edits merged in. */
export function buildMemberUpdate(original: FamilyMember, latest: FamilyMember, values: FormValues, relations: HorizontalRelation[]): FamilyMemberWriteInput {
  if (original.id !== latest.id) throw new MemberConflict();
  const before = memberToFormValues(original); const fresh = memberToFormValues(latest);
  const merged = { ...fresh };
  for (const key of Object.keys(before) as (keyof FormValues)[]) {
    if (key === 'childIds' || before[key] === values[key]) continue;
    if (fresh[key] !== before[key] && fresh[key] !== values[key]) throw new MemberConflict();
    (merged as Record<string, unknown>)[key] = values[key];
  }
  const input: FamilyMemberWriteInput = toFamilyInput(merged);
  if (equalSet(before.childIds, values.childIds, String)) delete input.childIds;
  else input.childIds = mergeSelection(before.childIds, values.childIds, fresh.childIds, String).map(Number);
  if (!equalSet(original.horizontalRelations, relations, relationKey)) {
    for (const id of new Set([...original.horizontalRelations, ...relations].map(row => row.memberId))) {
      const prior = original.horizontalRelations.filter(row => row.memberId === id);
      const desired = relations.filter(row => row.memberId === id);
      const current = latest.horizontalRelations.filter(row => row.memberId === id);
      if (!equalSet(prior, desired, relationKey) && !equalSet(prior, current, relationKey) && !equalSet(desired, current, relationKey)) throw new MemberConflict();
    }
    input.horizontalRelations = mergeSelection(original.horizontalRelations, relations, latest.horizontalRelations, relationKey);
  }
  return input;
}
export function buildMemberCreate(values: FormValues, relations: HorizontalRelation[]): FamilyMemberWriteInput {
  return { ...toFamilyInput(values), ...(relations.length ? { horizontalRelations: relations } : {}) };
}
export function validateMemberEdit(values: FormValues, relations: HorizontalRelation[], copy: FamilyStrings, memberId?: number, now = new Date()): FormErrors {
  const errors: FormErrors = {};
  if (!values.fullName.trim()) errors.fullName = copy.nameRequired;
  else if (values.fullName.trim().length > 100) errors.fullName = copy.nameLength;
  const generation = Number(values.generation);
  if (!Number.isInteger(generation) || generation < 1 || generation > 2147483647) errors.generation = copy.generationInvalid;
  for (const [field, limit] of [['gender', 20], ['role', 50], ['address', 255], ['phoneNumber', 20], ['facebookUrl', 255], ['instagramUrl', 255]] as const) {
    if ((values[field]?.length ?? 0) > limit) errors[field] = copy.maxLength(limit);
  }
  if (values.dateOfBirth && !validDateOnly(values.dateOfBirth)) errors.dateOfBirth = copy.dateInvalid;
  if (values.lifeStatus === 'LIVING') { if (values.deathDate) errors.deathDate = copy.livingDeath; }
  else if (!values.deathDate || !validDateOnly(values.deathDate)) errors.deathDate = copy.deathRequired;
  else if (values.deathDate > vietnamDateString(now)) errors.deathDate = copy.deathFuture;
  else if (values.dateOfBirth && validDateOnly(values.dateOfBirth) && values.deathDate < values.dateOfBirth) errors.deathDate = copy.deathBeforeBirth;
  for (const key of ['fatherId', 'motherId', 'spouseId'] as const) {
    if (values[key] && (!Number.isSafeInteger(Number(values[key])) || Number(values[key]) <= 0)) errors[key] = copy.invalidRelation;
    if (memberId && Number(values[key]) === memberId) errors[key] = copy.selfRelation;
  }
  if (values.fatherId && values.fatherId === values.motherId) errors.motherId = copy.parentsDiffer;
  if (values.childIds.some(id => !Number.isSafeInteger(Number(id)) || Number(id) <= 0 || Number(id) === memberId)) errors.form = copy.selfRelation;
  if (values.childIds.some(id => id === values.fatherId || id === values.motherId)) errors.form = copy.invalidRelation;
  if (relations.some(row => !Number.isSafeInteger(row.memberId) || row.memberId <= 0 || row.memberId === memberId || !row.relationType.trim() || row.relationType.trim().length > 50)) errors.form = copy.invalidRelation;
  return errors;
}
