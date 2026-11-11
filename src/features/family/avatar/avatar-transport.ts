import { appEnv } from '@/config/env';
import { authTokenStorage } from '@/features/auth/storage/authTokenStorage';
import { apiRequest } from '@/api/apiClient';
import { createSingleFlight } from '@/api/singleFlight';

// Shares the existing refresh/logout/version boundary. No new token store.
export const probeAvatarSession = createSingleFlight(() => apiRequest('/api/me'));
export function managedAvatarSource(base: string | null, accountId: number, memberId: number, revision: string, accessToken: string) {
  if (!base || !Number.isSafeInteger(accountId) || accountId <= 0 || !Number.isSafeInteger(memberId) || memberId <= 0 || !accessToken) throw new Error('AVATAR_UNAVAILABLE');
  const configured = new URL(base);
  if (!['http:', 'https:'].includes(configured.protocol) || configured.username || configured.password || configured.search || configured.hash) throw new Error('AVATAR_UNAVAILABLE');
  // Never use avatarUrl from member data for an authenticated image request.
  const uri = `${base.replace(/\/+$/, '')}/api/family-tree/${memberId}/avatar/image?v=${encodeURIComponent(revision)}`;
  if (new URL(uri).origin !== configured.origin) throw new Error('AVATAR_UNAVAILABLE');
  return { uri, headers: { Authorization: `Bearer ${accessToken}`, 'X-Client-Platform': 'mobile', Accept: 'image/jpeg,image/png,image/webp,image/gif' }, cacheKey: `family-avatar:${accountId}:${memberId}:${revision}` };
}
export async function readAvatarSource(accountId: number, memberId: number, revision: string) {
  const tokens = await authTokenStorage.read();
  return managedAvatarSource(appEnv.apiBaseUrl, accountId, memberId, revision, tokens?.accessToken ?? '');
}
export const avatarMaxBytes = 5 * 1024 * 1024;
export function validPickedAvatar(asset: { uri: string; mimeType?: string | null; fileSize?: number }): boolean {
  const mime = asset.mimeType?.toLowerCase() === 'image/jpg' ? 'image/jpeg' : asset.mimeType?.toLowerCase();
  return /^(file:|content:|blob:|data:image\/)/i.test(asset.uri)
    && !!mime && ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mime)
    && (asset.fileSize === undefined || (asset.fileSize > 0 && asset.fileSize <= avatarMaxBytes));
}
