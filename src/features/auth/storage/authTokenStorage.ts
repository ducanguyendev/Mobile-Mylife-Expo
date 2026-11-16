import * as SecureStore from 'expo-secure-store';

import type { AuthTokens } from '@/features/auth/types/auth';

const sessionKey = 'mylife.native.session.v1';
let pendingWrite: Promise<unknown> = Promise.resolve();
function serialize<T>(operation: () => Promise<T>) {
  const result = pendingWrite.then(operation, operation);
  pendingWrite = result.catch(() => undefined);
  return result;
}

export const authTokenStorage = {
  async read(): Promise<AuthTokens | null> {
    await pendingWrite;
    const serialized = await SecureStore.getItemAsync(sessionKey);
    if (!serialized) return null;
    try {
      const value = JSON.parse(serialized) as Partial<AuthTokens>;
      return isTokenPair(value) ? value : null;
    } catch {
      return null;
    }
  },
  async write(tokens: AuthTokens) {
    await serialize(() => SecureStore.setItemAsync(sessionKey, JSON.stringify(tokens)));
  },
  async writeIfCurrent(tokens: AuthTokens, isCurrent: () => boolean) {
    return serialize(async () => {
      if (!isCurrent()) return false;
      await SecureStore.setItemAsync(sessionKey, JSON.stringify(tokens));
      if (!isCurrent()) {
        // This operation still owns the serialized storage slot. Remove its
        // stale pair before a newer account can write its own pair.
        await SecureStore.deleteItemAsync(sessionKey);
        return false;
      }
      return true;
    });
  },
  async replaceRotated(tokens: AuthTokens) {
    // One SecureStore value makes the access and rotated refresh token a single replacement.
    await serialize(() => SecureStore.setItemAsync(sessionKey, JSON.stringify(tokens)));
  },
  async clear() {
    await serialize(() => SecureStore.deleteItemAsync(sessionKey));
  },
};

function isTokenPair(value: Partial<AuthTokens>): value is AuthTokens {
  return typeof value.accessToken === 'string' && value.accessToken.length > 0
    && typeof value.refreshToken === 'string' && value.refreshToken.length > 0
    && typeof value.accessTokenExpiresIn === 'number'
    && typeof value.refreshTokenExpiresIn === 'number';
}
