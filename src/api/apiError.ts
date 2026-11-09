export type ApiErrorKind = 'validation' | 'unauthorized' | 'forbidden' | 'rateLimited' | 'network' | 'server' | 'unknown';
export type ApiFieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly fieldErrors?: ApiFieldErrors;
  readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    kind: ApiErrorKind,
    status?: number,
    code?: string,
    fieldErrors?: ApiFieldErrors,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function normalizeApiError(input: {
  status?: number;
  body?: unknown;
  retryAfter?: string | null;
  network?: boolean;
  timeout?: boolean;
}): ApiError {
  const body = isRecord(input.body) ? input.body : {};
  const errors = isRecord(body.errors)
    ? Object.fromEntries(Object.entries(body.errors).map(([key, value]) => [key, Array.isArray(value) ? value.map(String) : [String(value)]]))
    : undefined;
  const status = input.status;
  const kind: ApiErrorKind = input.network || input.timeout ? 'network'
    : status === 400 || status === 422 ? 'validation'
      : status === 401 ? 'unauthorized'
        : status === 403 ? 'forbidden'
          : status === 429 ? 'rateLimited'
            : status !== undefined && status >= 500 ? 'server' : 'unknown';
  const retryAfterSeconds = parseRetryAfter(input.retryAfter);
  return new ApiError(
    typeof body.message === 'string' ? body.message : 'Request could not be completed.',
    kind,
    status,
    typeof body.code === 'string' ? body.code : undefined,
    errors,
    retryAfterSeconds,
  );
}

function parseRetryAfter(value: string | null | undefined) {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, Math.ceil(seconds));
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
