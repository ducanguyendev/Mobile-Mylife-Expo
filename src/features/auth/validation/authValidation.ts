import type { RegistrationInput } from '@/features/auth/types/auth';

export type RegistrationField = keyof RegistrationInput;
export type AuthFieldErrors = Partial<Record<RegistrationField | 'email' | 'password', string>>;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateLogin(emailInput: string, password: string, copy: {
  emailRequired: string; emailInvalid: string; emailTooLong: string; passwordRequired: string; passwordLoginLength: string;
}): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const email = normalizeEmail(emailInput);
  if (!email) errors.email = copy.emailRequired;
  else if (email.length > 254) errors.email = copy.emailTooLong;
  else if (!isValidEmail(email)) errors.email = copy.emailInvalid;
  if (!password) errors.password = copy.passwordRequired;
  else if (password.length < 8 || password.length > 72) errors.password = copy.passwordLoginLength;
  return errors;
}

export function validateRegistration(input: RegistrationInput, copy: {
  emailRequired: string; emailInvalid: string; emailTooLong: string; passwordRequired: string; nameRequired: string; nameLength: string;
  nameLetters: string; phoneRequired: string; phoneInvalid: string; genderRequired: string; dobRequired: string; dobFormat: string;
  dobInvalid: string; dobFuture: string; dobAge: string; gmail: string; passwordMin: string; passwordBytes: string; passwordLower: string;
  passwordUpper: string; passwordNumber: string; passwordSpecial: string; confirmRequired: string; confirmMismatch: string;
}): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const name = normalizeFullName(input.fullName);
  const email = normalizeEmail(input.email);
  const phone = input.phoneNumber.trim();

  if (!name) errors.fullName = copy.nameRequired;
  else if ([...name].length < 2 || [...name].length > 50) errors.fullName = copy.nameLength;
  else if (!/^\p{L}+(?:\s+\p{L}+)*$/u.test(name)) errors.fullName = copy.nameLetters;

  if (!phone) errors.phoneNumber = copy.phoneRequired;
  else if (!/^0[35789]\d{8}$/.test(phone)) errors.phoneNumber = copy.phoneInvalid;

  if (!['Nam', 'Nữ', 'Khác'].includes(input.gender)) errors.gender = copy.genderRequired;

  const dob = validateDateOfBirth(input.dateOfBirth, copy);
  if (dob) errors.dateOfBirth = dob;

  if (!email) errors.email = copy.emailRequired;
  else if (email.length > 254) errors.email = copy.emailTooLong;
  else if (!isValidEmail(email)) errors.email = copy.emailInvalid;
  else if (!email.endsWith('@gmail.com')) errors.email = copy.gmail;

  if (!input.password) errors.password = copy.passwordRequired;
  else if (input.password.length < 8) errors.password = copy.passwordMin;
  else if (utf8ByteLength(input.password) > 72) errors.password = copy.passwordBytes;
  else if (!/[a-z]/.test(input.password)) errors.password = copy.passwordLower;
  else if (!/[A-Z]/.test(input.password)) errors.password = copy.passwordUpper;
  else if (!/[0-9]/.test(input.password)) errors.password = copy.passwordNumber;
  else if (!/[^A-Za-z0-9]/.test(input.password)) errors.password = copy.passwordSpecial;

  if (!input.confirmPassword) errors.confirmPassword = copy.confirmRequired;
  else if (input.password !== input.confirmPassword) errors.confirmPassword = copy.confirmMismatch;
  return errors;
}

export function normalizeFullName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function utf8ByteLength(value: string) {
  let bytes = 0;
  for (let index = 0; index < value.length; index++) {
    const codePoint = value.codePointAt(index) ?? 0;
    if (codePoint > 0xffff) index++;
    bytes += codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;
  }
  return bytes;
}

export function formatBirthDateForApi(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (parsed.getUTCFullYear() !== Number(year) || parsed.getUTCMonth() !== Number(month) - 1 || parsed.getUTCDate() !== Number(day)) return null;
  return `${year}-${month}-${day}`;
}

export function isValidEmail(email: string) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

function validateDateOfBirth(value: string, copy: {
  dobRequired: string; dobFormat: string; dobInvalid: string; dobFuture: string; dobAge: string;
}) {
  if (!value.trim()) return copy.dobRequired;
  const iso = formatBirthDateForApi(value);
  if (!iso) return /^\d{2}\/\d{2}\/\d{4}$/.test(value.trim()) ? copy.dobInvalid : copy.dobFormat;
  const [year, month, day] = iso.split('-').map(Number);
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dob = new Date(Date.UTC(year, month - 1, day));
  if (dob > today) return copy.dobFuture;
  let age = today.getUTCFullYear() - year;
  const anniversaryDay = Math.min(day, new Date(Date.UTC(today.getUTCFullYear(), month, 0)).getUTCDate());
  const birthdayHasPassed = today.getUTCMonth() + 1 > month
    || (today.getUTCMonth() + 1 === month && today.getUTCDate() >= anniversaryDay);
  if (!birthdayHasPassed) age--;
  if (age < 6 || age > 120) return copy.dobAge;
  return null;
}
