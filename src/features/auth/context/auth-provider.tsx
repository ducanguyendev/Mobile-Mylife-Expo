import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { apiRequest, clearSessionExpiredNotice } from '@/api/apiClient';
import { ApiError } from '@/api/apiError';
import { getCurrentUser, loginRequest, logoutRequest, registerRequest } from '@/features/auth/api/authApi';
import { onSessionExpired } from '@/features/auth/context/authEvents';
import { rememberedEmailStorage } from '@/features/auth/storage/rememberedEmailStorage';
import { authTokenStorage } from '@/features/auth/storage/authTokenStorage';
import type { AuthenticatedUser, AuthStatus, RegistrationInput } from '@/features/auth/types/auth';
import { hasRole } from '@/features/auth/validation/authRoles';

type AuthContextValue = {
  status: AuthStatus;
  user: AuthenticatedUser | null;
  rememberedEmail: string | null;
  rememberMe: boolean;
  setRememberEmailPreference: (remember: boolean, email?: string) => Promise<void>;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (input: RegistrationInput) => Promise<string>;
  logout: () => Promise<boolean>;
  restoreSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isAdmin: boolean;
  isUser: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => onSessionExpired(() => {
    setUser(null);
    setStatus('unauthenticated');
  }), []);

  const refreshSession = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setStatus('authenticated');
  }, []);

  const restoreSession = useCallback(async () => {
    let restoredUser: AuthenticatedUser | null = null;
    try {
      const [tokens, savedEmail] = await Promise.all([
        withTimeout(authTokenStorage.read().catch(() => null), 8_000),
        withTimeout(rememberedEmailStorage.read().catch(() => ({ rememberMe: false, email: null })), 3_000)
          .catch(() => ({ rememberMe: false, email: null })),
      ]);
      setRememberedEmail(savedEmail.email);
      setRememberMe(savedEmail.rememberMe);
      if (tokens) restoredUser = await withTimeout(getCurrentUser(), 32_000);
    } catch {
      await authTokenStorage.clear().catch(() => undefined);
    } finally {
      setUser(restoredUser);
      setStatus(restoredUser ? 'authenticated' : 'unauthenticated');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void restoreSession(); }, 0);
    return () => clearTimeout(timer);
  }, [restoreSession]);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (remember && normalizedEmail) {
      await rememberedEmailStorage.write(normalizedEmail).catch(() => undefined);
      setRememberedEmail(normalizedEmail);
    } else {
      await rememberedEmailStorage.clear().catch(() => undefined);
      setRememberedEmail(null);
    }
    setRememberMe(remember);
    const response = await loginRequest(normalizedEmail, password, remember);
    if (!hasNativeTokenPair(response)) {
      throw new ApiError(
        'The server did not return native session tokens. Check the X-Client-Platform: mobile request header.',
        'unknown',
        200,
        'AUTH_NATIVE_TOKENS_MISSING',
      );
    }
    await authTokenStorage.write({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      accessTokenExpiresIn: response.accessTokenExpiresIn,
      refreshTokenExpiresIn: response.refreshTokenExpiresIn,
    });
    clearSessionExpiredNotice();
    let currentUser: AuthenticatedUser;
    try {
      currentUser = await apiRequest<AuthenticatedUser>('/api/me');
    } catch (error) {
      await authTokenStorage.clear().catch(() => undefined);
      throw error;
    }
    if (remember && currentUser.email !== normalizedEmail) {
      await rememberedEmailStorage.write(currentUser.email).catch(() => undefined);
      setRememberedEmail(currentUser.email);
    }
    setUser(currentUser);
    setStatus('authenticated');
  }, []);

  const setRememberEmailPreference = useCallback(async (remember: boolean, email?: string) => {
    setRememberMe(remember);
    if (!remember) {
      await rememberedEmailStorage.clear().catch(() => undefined);
      setRememberedEmail(null);
    } else if (email?.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      await rememberedEmailStorage.write(normalizedEmail).catch(() => undefined);
      setRememberedEmail(normalizedEmail);
    }
  }, []);

  const register = useCallback(async (input: RegistrationInput) => {
    const response = await registerRequest(input);
    return response.email || input.email.trim().toLowerCase();
  }, []);

  const logout = useCallback(async () => {
    const [tokens, savedEmail] = await Promise.all([
      authTokenStorage.read().catch(() => null),
      rememberedEmailStorage.read(),
    ]);
    const serverLogout = tokens
      ? logoutRequest(tokens.refreshToken).then(() => true).catch(() => false)
      : Promise.resolve(true);
    await authTokenStorage.clear().catch(() => undefined);
    if (!savedEmail.rememberMe) {
      await rememberedEmailStorage.clear().catch(() => undefined);
      setRememberedEmail(null);
      setRememberMe(false);
    }
    setUser(null);
    setStatus('unauthenticated');
    return raceWithTimeout(serverLogout, 2500);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    status, user, rememberedEmail, rememberMe, setRememberEmailPreference, login, register, logout, restoreSession, refreshSession,
    isAdmin: hasRole(user, 'ADMIN'), isUser: hasRole(user, 'USER'),
  }), [status, user, rememberedEmail, rememberMe, setRememberEmailPreference, login, register, logout, restoreSession, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}

function raceWithTimeout(operation: Promise<boolean>, milliseconds: number) {
  return new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), milliseconds);
    operation.then((value) => { clearTimeout(timer); resolve(value); });
  });
}

function withTimeout<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Authentication bootstrap timed out.')), milliseconds);
    operation.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error: unknown) => { clearTimeout(timer); reject(error); },
    );
  });
}

function hasNativeTokenPair(value: unknown): value is {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
} {
  if (typeof value !== 'object' || value === null) return false;
  const tokens = value as Record<string, unknown>;
  return typeof tokens.accessToken === 'string' && tokens.accessToken.length > 0
    && typeof tokens.refreshToken === 'string' && tokens.refreshToken.length > 0
    && typeof tokens.accessTokenExpiresIn === 'number'
    && typeof tokens.refreshTokenExpiresIn === 'number';
}
