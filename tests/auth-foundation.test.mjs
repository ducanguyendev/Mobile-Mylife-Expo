import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeApiError } from '../src/api/apiError.ts';
import { createSingleFlight } from '../src/api/singleFlight.ts';
import { mapAuthApiError } from '../src/features/auth/validation/authErrorMessages.ts';
import { isAdmin, isUser } from '../src/features/auth/validation/authRoles.ts';
import { formatBirthDateForApi, normalizeEmail, normalizeFullName, utf8ByteLength, validateLogin, validateRegistration } from '../src/features/auth/validation/authValidation.ts';

const copy = {
  emailRequired: 'email required', emailInvalid: 'email invalid', emailTooLong: 'email too long', passwordRequired: 'password required',
  passwordLoginLength: 'login password length', nameRequired: 'name required', nameLength: 'name length', nameLetters: 'name letters',
  phoneRequired: 'phone required', phoneInvalid: 'phone invalid', genderRequired: 'gender required', dobRequired: 'dob required',
  dobFormat: 'dob format', dobInvalid: 'dob invalid', dobFuture: 'dob future', dobAge: 'dob age', gmail: 'gmail only',
  passwordMin: 'password min', passwordBytes: 'password bytes', passwordLower: 'lowercase', passwordUpper: 'uppercase',
  passwordNumber: 'number', passwordSpecial: 'special', confirmRequired: 'confirm required', confirmMismatch: 'confirm mismatch',
  locked: 'locked', roleUnavailable: 'role unavailable', invalidCredentials: 'invalid credentials', network: 'network', forbidden: 'forbidden',
  nativeTokensMissing: 'native tokens missing', originRejected: 'origin rejected', csrfHeaderRequired: 'csrf header required', nativeCookieRejected: 'native cookie rejected',
  retryAfter: (seconds) => `retry ${seconds}`, rateLimit: 'rate limited', server: 'server', fieldInvalid: 'invalid field', duplicateEmail: 'duplicate email',
  dobServer: 'dob invalid server', serviceUnavailable: 'service unavailable', configMissing: 'config missing',
};

const validRegistration = (overrides = {}) => ({
  fullName: '  Nguyễn   Minh An ', phoneNumber: '0912345678', gender: 'Nam', dateOfBirth: '16/12/2000',
  email: ' USER@gmail.com ', password: 'Valid_Pass1', confirmPassword: 'Valid_Pass1', ...overrides,
});

test('email and name normalization are predictable', () => {
  assert.equal(normalizeEmail('  USER@GMAIL.COM '), 'user@gmail.com');
  assert.equal(normalizeFullName('  Nguyễn   Minh An '), 'Nguyễn Minh An');
});

test('login validation checks email shape and required password bounds', () => {
  assert.deepEqual(validateLogin('bad', 'short', copy), { email: copy.emailInvalid, password: copy.passwordLoginLength });
  assert.deepEqual(validateLogin(' USER@gmail.com ', 'GoodPass1', copy), {});
});

test('registration validates Vietnam phone, gender, Gmail, and password confirmation', () => {
  assert.deepEqual(validateRegistration(validRegistration(), copy), {});
  const errors = validateRegistration(validRegistration({ phoneNumber: '0212345678', gender: 'unknown', email: 'user@example.com', confirmPassword: 'Different1!' }), copy);
  assert.equal(errors.phoneNumber, copy.phoneInvalid);
  assert.equal(errors.gender, copy.genderRequired);
  assert.equal(errors.email, copy.gmail);
  assert.equal(errors.confirmPassword, copy.confirmMismatch);
});

test('registration DOB is calendar-checked and formatted for the API', () => {
  assert.equal(formatBirthDateForApi('16/12/2005'), '2005-12-16');
  assert.equal(formatBirthDateForApi('31/02/2005'), null);
  assert.equal(validateRegistration(validRegistration({ dateOfBirth: '31/02/2005' }), copy).dateOfBirth, copy.dobInvalid);
});

test('password byte cap counts UTF-8 bytes rather than UTF-16 characters', () => {
  assert.equal(utf8ByteLength('a'.repeat(72)), 72);
  assert.equal(utf8ByteLength('é'.repeat(36)), 72);
  assert.equal(utf8ByteLength('😀'.repeat(18)), 72);
  assert.equal(validateRegistration(validRegistration({ password: 'Abc!😀'.repeat(12), confirmPassword: 'Abc!😀'.repeat(12) }), copy).password, copy.passwordBytes);
});

test('registration password checks the existing web strength requirements', () => {
  assert.equal(validateRegistration(validRegistration({ password: 'lowercase1!', confirmPassword: 'lowercase1!' }), copy).password, copy.passwordUpper);
  assert.equal(validateRegistration(validRegistration({ password: 'NoDigits!!', confirmPassword: 'NoDigits!!' }), copy).password, copy.passwordNumber);
});

test('auth API codes map to app-owned localized errors', () => {
  const error = normalizeApiError({ status: 409, body: { success: false, code: 'AUTH_EMAIL_ALREADY_REGISTERED', message: 'raw backend text' } });
  assert.equal(mapAuthApiError(error, copy).message, copy.duplicateEmail);
  assert.equal(mapAuthApiError(error, copy).message.includes('raw backend text'), false);
  const originRejected = normalizeApiError({ status: 403, body: { code: 'REQUEST_ORIGIN_REJECTED', message: 'The request origin could not be verified.' } });
  assert.equal(mapAuthApiError(originRejected, copy).message, copy.originRejected);
  const csrfHeaderRequired = normalizeApiError({ status: 403, body: { code: 'CSRF_HEADER_REQUIRED' } });
  assert.equal(mapAuthApiError(csrfHeaderRequired, copy).message, copy.csrfHeaderRequired);
  const cookieSessionRejected = normalizeApiError({ status: 403, body: { code: 'MOBILE_COOKIE_SESSION_REJECTED' } });
  assert.equal(mapAuthApiError(cookieSessionRejected, copy).message, copy.nativeCookieRejected);
});

test('API errors classify network and rate-limit responses without leaking raw status text', () => {
  const limited = normalizeApiError({ status: 429, retryAfter: '17', body: { message: 'opaque backend text' } });
  assert.equal(limited.kind, 'rateLimited');
  assert.equal(limited.retryAfterSeconds, 17);
  const offline = normalizeApiError({ network: true, timeout: true });
  assert.equal(offline.kind, 'network');
});

test('role helpers preserve the backend primary role contract', () => {
  const admin = { role: 'ADMIN', roles: ['ADMIN'] };
  const user = { role: 'USER', roles: ['USER'] };
  assert.equal(isAdmin(admin), true);
  assert.equal(isUser(admin), false);
  assert.equal(isUser(user), true);
  assert.equal(isAdmin({ role: 'ADMIN', roles: ['USER'] }), false);
});

test('concurrent refresh callers share exactly one rotating-token operation', async () => {
  let calls = 0;
  let release;
  const wait = new Promise((resolve) => { release = resolve; });
  const refresh = createSingleFlight(async () => { calls++; await wait; return 'rotated-session'; });
  const requests = [refresh(), refresh(), refresh(), refresh()];
  await Promise.resolve();
  assert.equal(calls, 1);
  release();
  assert.deepEqual(await Promise.all(requests), Array(4).fill('rotated-session'));
});
