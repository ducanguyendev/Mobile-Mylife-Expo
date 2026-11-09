import { appEnv } from '@/config/env';
import { Platform } from 'react-native';
import { emitSessionExpired } from '@/features/auth/context/authEvents';
import { authTokenStorage } from '@/features/auth/storage/authTokenStorage';
import type { AuthTokens } from '@/features/auth/types/auth';
import { ApiError, normalizeApiError } from './apiError';
import { createSingleFlight } from './singleFlight';

const timeoutMs = 15_000;
let expiredNoticeSent = false;
const refreshSingleFlight = createSingleFlight(performRefresh);

type ApiRequestOptions = RequestInit & {
  authenticated?: boolean;
  retryOnUnauthorized?: boolean;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { authenticated = true, retryOnUnauthorized = true, ...init } = options;
  const sentTokens = authenticated ? await authTokenStorage.read() : null;
  const response = await sendRequest(path, init, sentTokens);
  const payload = await parseResponse(response);

  if (response.status === 401 && authenticated && retryOnUnauthorized && path !== '/api/refresh-token') {
    const tokens = await authTokenStorage.read();
    if (!tokens) throw apiFailure(response, payload, path, init.method);
    const latest = sentTokens?.accessToken !== tokens.accessToken ? tokens : null;
    const refreshedAccessToken = latest?.accessToken ?? await refreshSingleFlight();
    if (!refreshedAccessToken) throw normalizeApiError({ status: 401, body: { message: 'Session has expired.' } });
    const retried = await sendRequest(path, init, latest ?? { ...tokens, accessToken: refreshedAccessToken });
    const retryPayload = await parseResponse(retried);
    if (!retried.ok) throw apiFailure(retried, retryPayload, path, init.method);
    return retryPayload as T;
  }

  if (!response.ok) throw apiFailure(response, payload, path, init.method);
  return payload as T;
}

export function clearSessionExpiredNotice() {
  expiredNoticeSent = false;
}

async function performRefresh(): Promise<string | null> {
  try {
    const current = await authTokenStorage.read();
    if (!current) return null;
    const response = await sendRequest('/api/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ accessToken: current.accessToken, refreshToken: current.refreshToken }),
    }, null);
    const payload = await parseResponse(response);
    if (!response.ok || !hasTokenPair(payload)) {
      await invalidateSession();
      return null;
    }
    await authTokenStorage.replaceRotated(payload);
    expiredNoticeSent = false;
    return payload.accessToken;
  } catch {
    await invalidateSession();
    return null;
  }
}

async function invalidateSession() {
  await authTokenStorage.clear().catch(() => undefined);
  if (!expiredNoticeSent) {
    expiredNoticeSent = true;
    emitSessionExpired();
  }
}

async function sendRequest(path: string, init: RequestInit, tokens: AuthTokens | null) {
  if (!appEnv.apiBaseUrl) {
    throw new ApiError('API base URL is not configured.', 'unknown');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  headers.set('X-Client-Platform', 'mobile');
  if (init.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (tokens?.accessToken) headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  try {
    return await fetch(`${appEnv.apiBaseUrl}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
      credentials: Platform.OS === 'web' ? 'same-origin' : 'omit',
    });
  } catch {
    throw normalizeApiError({ network: true, timeout: controller.signal.aborted });
  } finally {
    clearTimeout(timer);
  }
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text) as unknown; } catch { return null; }
}

function apiFailure(response: Response, payload: unknown, path: string, method?: string) {
  const error = normalizeApiError({ status: response.status, body: payload, retryAfter: response.headers.get('Retry-After') });
  if (__DEV__) {
    console.warn('[MyLife API] request rejected', {
      method: method ?? 'GET',
      path,
      status: response.status,
      code: error.code,
      requestId: response.headers.get('X-Request-ID'),
    });
  }
  return error;
}

function hasTokenPair(value: unknown): value is AuthTokens {
  if (typeof value !== 'object' || value === null) return false;
  const tokens = value as Partial<AuthTokens>;
  return typeof tokens.accessToken === 'string' && tokens.accessToken.length > 0
    && typeof tokens.refreshToken === 'string' && tokens.refreshToken.length > 0
    && typeof tokens.accessTokenExpiresIn === 'number'
    && typeof tokens.refreshTokenExpiresIn === 'number';
}
