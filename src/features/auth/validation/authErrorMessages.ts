import { ApiError } from '../../../api/apiError.ts';
import type { AuthStrings } from '@/features/auth/i18n/authStrings';
import type { AuthFieldErrors } from './authValidation';

export function mapAuthApiError(error: unknown, copy: AuthStrings): { message: string; fieldErrors: AuthFieldErrors } {
  if (!(error instanceof ApiError)) return { message: copy.server, fieldErrors: {} };
  if (/api base url is not configured/i.test(error.message)) return { message: copy.configMissing, fieldErrors: {} };
  const codeMessages: Record<string, string> = {
    AUTH_NATIVE_TOKENS_MISSING: copy.nativeTokensMissing,
    REQUEST_ORIGIN_REJECTED: copy.originRejected,
    CSRF_HEADER_REQUIRED: copy.csrfHeaderRequired,
    MOBILE_COOKIE_SESSION_REJECTED: copy.nativeCookieRejected,
    AUTH_PASSWORD_MISMATCH: copy.confirmMismatch,
    AUTH_PASSWORD_TOO_LONG: copy.passwordBytes,
    AUTH_GMAIL_REQUIRED: copy.gmail,
    AUTH_EMAIL_ALREADY_REGISTERED: copy.duplicateEmail,
    AUTH_DOB_INVALID: copy.dobServer,
    AUTH_SERVICE_NOT_INITIALIZED: copy.serviceUnavailable,
  };
  const message = codeMessages[error.code ?? ''] ?? messageByError(error, copy);
  const fieldErrors: AuthFieldErrors = {};
  for (const field of Object.keys(error.fieldErrors ?? {})) {
    const normalized = field.toLowerCase();
    const target = normalized.includes('fullname') ? 'fullName'
      : normalized.includes('phone') ? 'phoneNumber'
        : normalized.includes('gender') ? 'gender'
          : normalized.includes('dateofbirth') ? 'dateOfBirth'
            : normalized.includes('email') ? 'email'
              : normalized.includes('password') ? 'password' : null;
    if (target) fieldErrors[target] = copy.fieldInvalid;
  }
  if (error.code === 'AUTH_EMAIL_ALREADY_REGISTERED') fieldErrors.email = copy.duplicateEmail;
  if (error.code === 'AUTH_GMAIL_REQUIRED') fieldErrors.email = copy.gmail;
  if (error.code === 'AUTH_DOB_INVALID') fieldErrors.dateOfBirth = copy.dobServer;
  if (error.code === 'AUTH_PASSWORD_TOO_LONG') fieldErrors.password = copy.passwordBytes;
  if (error.code === 'AUTH_PASSWORD_MISMATCH') fieldErrors.confirmPassword = copy.confirmMismatch;
  return { message, fieldErrors };
}

function messageByError(error: ApiError, copy: AuthStrings) {
  if (error.status === 401 && /locked/i.test(error.message)) return copy.locked;
  if (error.status === 401 && /role/i.test(error.message)) return copy.roleUnavailable;
  if (error.status === 401 && /session has expired|session is invalid/i.test(error.message)) return copy.sessionExpired;
  if (error.kind === 'unauthorized') return copy.invalidCredentials;
  if (error.kind === 'network') return copy.network;
  if (error.kind === 'forbidden') return copy.forbidden;
  if (error.kind === 'rateLimited') return error.retryAfterSeconds ? copy.retryAfter(error.retryAfterSeconds) : copy.rateLimit;
  if (error.kind === 'server') return copy.server;
  return copy.fieldInvalid;
}
