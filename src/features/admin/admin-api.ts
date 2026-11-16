import { apiRequest, getSessionVersion } from '@/api/apiClient';
import { profileApi } from '@/features/profile/profile-api';
import { role } from '@/features/profile/profile-data';
import type { AuthenticatedUser, UserRole } from '@/features/auth/types/auth';
import { canAdminister, collection, log, stats, users } from './admin-data';

async function authorized<T>(path: string, init: RequestInit = {}): Promise<T> {
  const version = getSessionVersion();
  const actor = await profileApi.me(init.signal ?? undefined);
  if (actor.role !== 'ADMIN' || !actor.isActive || version !== getSessionVersion()) throw Object.assign(Error('ADMIN_REQUIRED'), { status: 403 });
  return apiRequest<T>(path, init);
}
export const adminApi = {
  stats: async (signal?: AbortSignal) => stats(await authorized('/api/admin/stats', { signal })),
  users: async (signal?: AbortSignal) => users(await authorized('/api/admin/users', { signal })),
  logs: async (signal?: AbortSignal) => collection(await authorized('/api/admin/logs', { signal }), log),
  async mutate(actorId: number, original: AuthenticatedUser, action: 'role' | 'status' | 'delete', signal: AbortSignal, nextRole?: UserRole) {
    const actor = await profileApi.me(signal);
    if (actor.id !== actorId || actor.role !== 'ADMIN') throw Object.assign(Error('ADMIN_REQUIRED'), { status: 403 });
    if (!canAdminister(actorId, original, action)) throw Object.assign(Error('PROTECTED_ACCOUNT'), { status: 400 });
    const fresh = (await adminApi.users(signal)).find(item => item.id === original.id);
    if (!fresh || !canAdminister(actorId, fresh, action) || fresh.updatedAt !== original.updatedAt || fresh.role !== original.role || fresh.isActive !== original.isActive) throw Object.assign(Error('ADMIN_STALE'), { status: 409 });
    const path = `/api/admin/users/${fresh.id}`;
    const body = action === 'role' ? { role: role(nextRole) } : { isActive: !fresh.isActive };
    const result = await authorized<{ success: boolean; role?: UserRole; isActive?: boolean } | null>(path + (action === 'delete' ? '' : `/${action}`), {
      method: action === 'delete' ? 'DELETE' : 'PUT', ...(action === 'delete' ? {} : { body: JSON.stringify(body) }), signal,
    });
    if (action === 'delete' ? result !== null && result?.success !== true : result?.success !== true || (action === 'role' ? result.role !== nextRole : result.isActive !== !fresh.isActive)) throw Error('INVALID_DATA');
  },
};
