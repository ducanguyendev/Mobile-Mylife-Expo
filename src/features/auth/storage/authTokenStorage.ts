import * as SecureStore from 'expo-secure-store';

import type { AuthTokens } from '@/features/auth/types/auth';

const sessionKey = 'mylife.native.session.v1';

export const authTokenStorage = {
  async read(): Promise<AuthTokens | null> {
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
    await SecureStore.setItemAsync(sessionKey, JSON.stringify(tokens));
  },
  async replaceRotated(tokens: AuthTokens) {
    // One SecureStore value makes the access and rotated refresh token a single replacement.
    await SecureStore.setItemAsync(sessionKey, JSON.stringify(tokens));
  },
  async clear() {
    await SecureStore.deleteItemAsync(sessionKey);
  },
};

function isTokenPair(value: Partial<AuthTokens>): value is AuthTokens {
  return typeof value.accessToken === 'string' && value.accessToken.length > 0
    && typeof value.refreshToken === 'string' && value.refreshToken.length > 0
    && typeof value.accessTokenExpiresIn === 'number'
    && typeof value.refreshTokenExpiresIn === 'number';
}
