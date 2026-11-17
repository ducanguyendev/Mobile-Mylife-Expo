import { appEnv } from '@/config/env';
import { Platform } from 'react-native';
import { emitSessionExpired } from '@/features/auth/context/authEvents';
import { authTokenStorage } from '@/features/auth/storage/authTokenStorage';
import type { AuthTokens } from '@/features/auth/types/auth';
import { ApiError, normalizeApiError } from './apiError';
import { createSingleFlight } from './singleFlight';
import { invalidateReads, onSessionBoundary, onWriteBoundary, releaseSessionResources } from './session-resources';

const timeoutMs = 15_000;
let expiredNoticeSent = false;
let sessionVersion = 0;
let signingOut = false;
let activeRefresh: Promise<string | null> | null = null;
let activeLogout: Promise<boolean> | null = null;
const refreshSingleFlight = createSingleFlight(() => {
  const operation = performRefresh();
  activeRefresh = operation;
  return operation.finally(() => { if (activeRefresh === operation) activeRefresh = null; });
});

type ApiRequestOptions = RequestInit & {
  authenticated?: boolean;
  retryOnUnauthorized?: boolean;
  responseType?: 'json' | 'blob';
  coalesce?: boolean;
};

type ReadFlight = { controller: AbortController; promise: Promise<unknown>; consumers: number; settled: boolean };
const reads = new Map<string, ReadFlight>();
const activeReads = new Set<ReadFlight>();
// Writes detach earlier reads so a post-write reload cannot join an older GET.
onWriteBoundary(() => reads.clear());
onSessionBoundary(() => { activeReads.forEach(flight => flight.controller.abort()); reads.clear(); activeReads.clear(); });
export function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    invalidateReads();
    return performRequest<T>(path, options).finally(invalidateReads);
  }
  if (!options.coalesce || options.authenticated === false || options.responseType === 'blob' || options.body != null) return performRequest<T>(path, options);
  if (options.signal?.aborted) return Promise.reject(normalizeApiError({ network: true, timeout: true }));
  const { signal, headers, ...keyOptions } = options;
  delete keyOptions.coalesce;
  const key = JSON.stringify([sessionVersion, path, keyOptions, [...new Headers(headers).entries()].sort()]);
  let flight = reads.get(key);
  if (!flight || flight.controller.signal.aborted) {
    const controller = new AbortController();
    flight = { controller, consumers: 0, settled: false, promise: Promise.resolve() };
    const current = flight;
    activeReads.add(current);
    current.promise = performRequest<T>(path, { ...options, signal: controller.signal }).finally(() => {
      current.settled = true;
      activeReads.delete(current);
      if (reads.get(key) === current) reads.delete(key);
    });
    reads.set(key, current);
  }
  const current = flight; current.consumers++;
  return new Promise<T>((resolve, reject) => {
    let finished = false;
    const release = () => {
      signal?.removeEventListener('abort', abort);
      if (--current.consumers === 0 && !current.settled) { current.controller.abort(); if (reads.get(key) === current) reads.delete(key); }
    };
    const abort = () => { if (finished) return; finished = true; release(); reject(normalizeApiError({ network: true, timeout: true })); };
    signal?.addEventListener('abort', abort, { once: true });
    current.promise.then(value => { if (!finished) { finished = true; release(); resolve(value as T); } }, error => { if (!finished) { finished = true; release(); reject(error); } });
    if (signal?.aborted) abort();
  });
}
async function performRequest<T>(path: string, options: ApiRequestOptions): Promise<T> {
  const { authenticated = true, retryOnUnauthorized = true, responseType = 'json', ...init } = options;
  delete init.coalesce;
  const version = sessionVersion;
  const sentTokens = authenticated ? await authTokenStorage.read() : null;
  if (authenticated && (signingOut || version !== sessionVersion)) throw normalizeApiError({ status: 401 });
  const { response, payload } = await sendRequest(path, init, sentTokens, responseType);
  if (init.signal?.aborted) throw normalizeApiError({ network: true, timeout: true });
  if (authenticated && (signingOut || version !== sessionVersion)) throw normalizeApiError({ status: 401 });

  if (response.status === 401 && authenticated && retryOnUnauthorized && path !== '/api/refresh-token') {
    const tokens = await authTokenStorage.read();
    if (!tokens) throw apiFailure(response, payload, path, init.method);
    const latest = sentTokens?.accessToken !== tokens.accessToken ? tokens : null;
    const refreshedAccessToken = latest?.accessToken ?? await refreshSingleFlight();
    if (!refreshedAccessToken || signingOut || version !== sessionVersion) throw normalizeApiError({ status: 401, body: { message: 'Session has expired.' } });
    const { response: retried, payload: retryPayload } = await sendRequest(path, init, latest ?? { ...tokens, accessToken: refreshedAccessToken }, responseType);
    if (init.signal?.aborted) throw normalizeApiError({ network: true, timeout: true });
    if (signingOut || version !== sessionVersion) throw normalizeApiError({ status: 401 });
    if (!retried.ok) {
      if (retried.status === 401) await invalidateSession(version);
      throw apiFailure(retried, retryPayload, path, init.method);
    }
    return retryPayload as T;
  }

  if (!response.ok) throw apiFailure(response, payload, path, init.method);
  return payload as T;
}

export function clearSessionExpiredNotice() {
  sessionVersion++;
  releaseSessionResources();
  signingOut = false;
  expiredNoticeSent = false;
}

export function getSessionVersion() { return sessionVersion; }

export function logoutNativeSession(): Promise<boolean> {
  if (activeLogout && signingOut) return activeLogout;
  signingOut = true;
  const version = ++sessionVersion;
  releaseSessionResources();
  const pending = activeRefresh;
  const operation = (async () => {
    const tokens = await authTokenStorage.read().catch(() => null);
    let acknowledged = true;
    if (version === sessionVersion) {
      try { await authTokenStorage.clear(); } catch { acknowledged = false; }
    }
    try { await pending; } catch { acknowledged = false; }
    if (tokens) {
      try { await revokeRefreshToken(tokens.refreshToken); } catch { acknowledged = false; }
    }
    return acknowledged;
  })();
  const completion = operation.finally(() => { if (activeLogout === completion) activeLogout = null; });
  activeLogout = completion;
  return completion;
}

async function performRefresh(): Promise<string | null> {
  const version = sessionVersion;
  try {
    const current = await authTokenStorage.read();
    if (!current) return null;
    const { response, payload } = await sendRequest('/api/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ accessToken: current.accessToken, refreshToken: current.refreshToken }),
    }, null);
    if (!response.ok || !hasTokenPair(payload)) {
      await invalidateSession(version);
      return null;
    }
    if (signingOut || version !== sessionVersion) {
      // Rotation may already have succeeded on the server when the user signs out.
      // Revoke that new session without persisting it or clearing a newer login.
      await revokeRefreshToken(payload.refreshToken);
      return null;
    }
    await authTokenStorage.replaceRotated(payload);
    if (signingOut || version !== sessionVersion) {
      await revokeRefreshToken(payload.refreshToken);
      // SecureStore itself is asynchronous; remove a write that crossed logout.
      const stored = await authTokenStorage.read();
      if (stored?.accessToken === payload.accessToken) await authTokenStorage.clear();
      return null;
    }
    expiredNoticeSent = false;
    return payload.accessToken;
  } catch (error) {
    if (signingOut || version !== sessionVersion) throw error;
    await invalidateSession(version);
    return null;
  }
}

async function revokeRefreshToken(refreshToken: string) {
  const { response } = await sendRequest('/api/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }, null);
  if (!response.ok) throw normalizeApiError({ status: response.status });
}

async function invalidateSession(version: number) {
  if (version !== sessionVersion || signingOut) return;
  await authTokenStorage.clear().catch(() => undefined);
  if (version !== sessionVersion || signingOut) return;
  if (!expiredNoticeSent) {
    expiredNoticeSent = true;
    releaseSessionResources();
    emitSessionExpired();
  }
}

async function sendRequest(path: string, init: RequestInit, tokens: AuthTokens | null, responseType: 'json' | 'blob' = 'json') {
  if (!appEnv.apiBaseUrl) {
    throw new ApiError('API base URL is not configured.', 'unknown');
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (init.signal?.aborted) abort();
  else init.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  headers.set('X-Client-Platform', 'mobile');
  // Native fetch owns the multipart boundary; forcing JSON corrupts file uploads.
  const multipart = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (init.body !== undefined && !multipart && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (tokens?.accessToken) headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  try {
    const response = await fetch(`${appEnv.apiBaseUrl}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
      credentials: Platform.OS === 'web' ? 'same-origin' : 'omit',
    });
    // Keep the caller's abort and deadline attached until body consumption ends,
    // including private image bytes, instead of stopping them at response headers.
    const payload = responseType === 'blob' && response.ok ? await response.blob() : await parseResponse(response);
    return { response, payload };
  } catch {
    throw normalizeApiError({ network: true, timeout: controller.signal.aborted });
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener('abort', abort);
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
