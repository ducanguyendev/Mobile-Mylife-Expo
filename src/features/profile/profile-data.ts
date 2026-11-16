import type { AuthenticatedUser, UserRole } from '@/features/auth/types/auth';
import { formatBirthDateForApi, normalizeFullName, utf8ByteLength } from '@/features/auth/validation/authValidation';

export type ProfileInput = { displayName: string; phoneNumber: string; gender: string; dateOfBirth: string };
export type PasswordInput = { currentPassword: string; newPassword: string; confirmPassword: string };
export function role(value: unknown): UserRole {
  if (value !== 'USER' && value !== 'ADMIN') throw Error('INVALID_DATA');
  return value;
}
export function account(value: unknown): AuthenticatedUser {
  const user = value as AuthenticatedUser | null;
  if (!user || !Number.isSafeInteger(user.id) || user.id <= 0 || typeof user.email !== 'string' || !user.email
    || typeof user.isActive !== 'boolean' || typeof user.loginProviders?.local !== 'boolean' || typeof user.loginProviders?.google !== 'boolean') throw Error('INVALID_DATA');
  role(user.role);
  for (const key of ['fullName', 'displayName', 'phoneNumber', 'gender', 'dateOfBirth', 'avatarUrl', 'updatedAt', 'createdAt'] as const) {
    if (user[key] != null && typeof user[key] !== 'string') throw Error('INVALID_DATA');
  }
  if (user.roles && (!Array.isArray(user.roles) || user.roles.length !== 1 || user.roles[0] !== user.role)) throw Error('INVALID_DATA');
  return user;
}
export function profileInput(user: AuthenticatedUser): ProfileInput {
  const date = user.dateOfBirth?.split('-');
  return { displayName: user.displayName ?? '', phoneNumber: user.phoneNumber ?? '', gender: user.gender ?? '', dateOfBirth: date?.length === 3 ? `${date[2]}/${date[1]}/${date[0]}` : '' };
}
export function validateProfile(input: ProfileInput, today = new Date().toISOString().slice(0, 10)) {
  const displayName = normalizeFullName(input.displayName);
  const phoneNumber = input.phoneNumber.trim().replace(/\s+/g, '');
  const dateOfBirth = formatBirthDateForApi(input.dateOfBirth);
  const errors: Partial<Record<keyof ProfileInput, string>> = {};
  if (displayName.length < 1 || displayName.length > 100) errors.displayName = 'nameInvalid';
  if (!/^0[35789]\d{8}$/.test(phoneNumber)) errors.phoneNumber = 'phoneInvalid';
  if (!['Nam', 'Nữ', 'Khác'].includes(input.gender)) errors.gender = 'genderInvalid';
  if (!dateOfBirth || dateOfBirth > today) errors.dateOfBirth = 'dateInvalid';
  return { errors, values: { displayName, phoneNumber, gender: input.gender, dateOfBirth } };
}
export function validatePassword(input: PasswordInput) {
  const errors: Partial<Record<keyof PasswordInput, string>> = {};
  if (!input.currentPassword) errors.currentPassword = 'required';
  if (input.newPassword.length < 8 || utf8ByteLength(input.newPassword) > 72) errors.newPassword = 'passwordInvalid';
  else if (input.newPassword === input.currentPassword) errors.newPassword = 'passwordSame';
  if (!input.confirmPassword || input.confirmPassword !== input.newPassword) errors.confirmPassword = 'passwordMismatch';
  return errors;
}
export function passwordStrength(value: string) {
  return [value.length >= 8, /[A-Z]/.test(value), /[0-9]/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
}
export function assertProfileUnchanged(original: AuthenticatedUser, fresh: AuthenticatedUser) {
  if (original.id !== fresh.id || original.updatedAt !== fresh.updatedAt || JSON.stringify(profileInput(original)) !== JSON.stringify(profileInput(fresh))) throw Error('PROFILE_CONFLICT');
}
export function providerLabel(user: AuthenticatedUser) {
  return [user.loginProviders?.local ? 'Email' : '', user.loginProviders?.google ? 'Google' : ''].filter(Boolean).join(' · ') || '—';
}
export function accountAvatarUri(user: AuthenticatedUser | null) {
  if (!user?.avatarUrl) return undefined;
  try {
    const url = new URL(user.avatarUrl);
    if (url.protocol !== 'https:' || url.username || url.password) return undefined;
    if (user.updatedAt) url.searchParams.set('t', user.updatedAt);
    return url.toString();
  } catch { return undefined; }
}
