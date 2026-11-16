import { apiRequest, getSessionVersion } from '@/api/apiClient';
import { account, assertProfileUnchanged, validatePassword, validateProfile, type PasswordInput, type ProfileInput } from './profile-data';
import type { AuthenticatedUser } from '@/features/auth/types/auth';

export const profileApi = {
  me: async (signal?: AbortSignal) => account(await apiRequest('/api/me', { signal })),
  async save(original: AuthenticatedUser, input: ProfileInput, signal: AbortSignal) {
    const { errors, values } = validateProfile(input);
    if (Object.keys(errors).length) throw Error('INVALID_FORM');
    assertProfileUnchanged(original, await profileApi.me(signal));
    const result = await apiRequest<{ success: boolean }>('/api/me/profile', { method: 'PUT', body: JSON.stringify(values), signal });
    if (result?.success !== true) throw Error('INVALID_DATA');
    return profileApi.me(signal);
  },
  async password(input: PasswordInput, signal: AbortSignal) {
    if (Object.keys(validatePassword(input)).length) throw Error('INVALID_FORM');
    if (!(await profileApi.me(signal)).loginProviders?.local) throw Error('LOCAL_REQUIRED');
    const result = await apiRequest<{ success: boolean }>('/api/auth/change-password', { method: 'POST', body: JSON.stringify(input), signal });
    if (result?.success !== true) throw Error('INVALID_DATA');
  },
  async avatar(body: FormData | null, signal: AbortSignal) {
    const result = await apiRequest<{ avatarUrl?: string; message?: string }>('/api/avatar' + (body ? '/upload' : ''), { method: body ? 'POST' : 'DELETE', ...(body ? { body } : {}), signal });
    if (body && !result?.avatarUrl) throw Error('INVALID_DATA');
    return profileApi.me(signal);
  },
};

// Preserve busy/uncertain flags across route reopening. No account data is retained.
const writes = new Map<string, { busy: boolean; uncertain: boolean; retryAt: number }>();
export function accountWrites(accountId: number) {
  const version = getSessionVersion();
  const key = `${version}:${accountId}`;
  for (const oldKey of writes.keys()) if (!oldKey.startsWith(`${version}:`)) writes.delete(oldKey);
  let state = writes.get(key);
  if (!state) { state = { busy: false, uncertain: false, retryAt: 0 }; writes.set(key, state); }
  const current = state;
  return {
    get busy() { return current.busy; },
    get uncertain() { return current.uncertain; },
    reconcile() { if (version !== getSessionVersion() || current.busy) throw Error('SESSION_CHANGED'); current.uncertain = false; },
    async run<T>(operation: () => Promise<T>) {
      if (version !== getSessionVersion()) throw Error('SESSION_CHANGED');
      if (current.busy || current.uncertain) throw Error('RECONCILE');
      if (Date.now() < current.retryAt) throw Error('RATE_LIMIT');
      current.busy = true;
      try {
        const result = await operation();
        if (version !== getSessionVersion()) throw Error('SESSION_CHANGED');
        return result;
      } catch (error) {
        const failure = error as { status?: number; retryAfterSeconds?: number; message?: string };
        if (failure.status === 429) current.retryAt = Date.now() + Math.max(1, failure.retryAfterSeconds ?? 60) * 1000;
        const localRejection = ['INVALID_FORM', 'LIBRARY_INVALID_IMAGE', 'LIBRARY_UPLOAD_CANCELED', 'PROFILE_CONFLICT', 'LOCAL_REQUIRED'].includes(failure.message ?? '');
        if (!localRejection && (!failure.status || failure.status >= 500)) current.uncertain = true;
        throw error;
      } finally { current.busy = false; }
    },
  };
}
