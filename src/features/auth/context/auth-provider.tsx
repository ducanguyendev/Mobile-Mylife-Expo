import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { clearSessionExpiredNotice, getSessionVersion, logoutNativeSession } from '@/api/apiClient';
import { ApiError } from '@/api/apiError';
import { getCurrentUser, loginRequest, logoutRequest, registerRequest } from '@/features/auth/api/authApi';
import { onSessionExpired } from '@/features/auth/context/authEvents';
import { rememberedEmailStorage } from '@/features/auth/storage/rememberedEmailStorage';
import { authTokenStorage } from '@/features/auth/storage/authTokenStorage';
import type { AuthenticatedUser, AuthStatus, RegistrationInput } from '@/features/auth/types/auth';
import { hasRole } from '@/features/auth/validation/authRoles';
import { AppState } from 'react-native';

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

const noPreparation = async () => undefined;
export function AuthProvider({ children, beforeAuthenticated = noPreparation }: PropsWithChildren<{ beforeAuthenticated?: () => Promise<void> }>) {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [operations] = useState(createAuthOperations);

  useEffect(() => onSessionExpired(() => {
    operations.begin();
    setUser(null);
    setStatus('unauthenticated');
  }), [operations]);

  const refreshSession = useCallback(async () => {
    const version = getSessionVersion();
    const generation = operations.generation();
    const request = operations.read();
    const currentUser = await getCurrentUser();
    if (version !== getSessionVersion() || !operations.current(generation, request)) return;
    await beforeAuthenticated();
    if (version !== getSessionVersion() || !operations.current(generation, request)) return;
    setUser(currentUser);
    setStatus('authenticated');
  }, [beforeAuthenticated, operations]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const subscription = AppState.addEventListener('change', next => { if (next === 'active') void refreshSession().catch(() => undefined); });
    const timer = setInterval(() => { if (AppState.currentState === 'active') void refreshSession().catch(() => undefined); }, 30_000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, [refreshSession, status]);

  const restoreSession = useCallback(async () => {
    const generation = operations.begin();
    let restoredUser: AuthenticatedUser | null = null;
    try {
      const [tokens, savedEmail] = await Promise.all([
        withTimeout(authTokenStorage.read().catch(() => null), 8_000),
        withTimeout(rememberedEmailStorage.read().catch(() => ({ rememberMe: false, email: null })), 3_000)
          .catch(() => ({ rememberMe: false, email: null })),
      ]);
      setRememberedEmail(savedEmail.email);
      setRememberMe(savedEmail.rememberMe);
      if (tokens) {
        restoredUser = await withTimeout(getCurrentUser(), 32_000);
        if (operations.current(generation)) await beforeAuthenticated();
      }
    } catch {
      restoredUser = null;
      if (operations.current(generation)) await authTokenStorage.clear().catch(() => undefined);
    } finally {
      if (!operations.current(generation)) return;
      setUser(restoredUser);
      setStatus(restoredUser ? 'authenticated' : 'unauthenticated');
    }
  }, [beforeAuthenticated, operations]);

  useEffect(() => {
    const timer = setTimeout(() => { void restoreSession(); }, 0);
    return () => clearTimeout(timer);
  }, [restoreSession]);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const generation = operations.begin();
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
    if (!operations.current(generation)) {
      if (hasNativeTokenPair(response)) await logoutRequest(response.refreshToken).catch(() => undefined);
      throw new ApiError('Session changed.', 'unauthorized', 401);
    }
    if (!hasNativeTokenPair(response)) {
      throw new ApiError(
        'The server did not return native session tokens. Check the X-Client-Platform: mobile request header.',
        'unknown',
        200,
        'AUTH_NATIVE_TOKENS_MISSING',
      );
    }
    const stored = await authTokenStorage.writeIfCurrent({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      accessTokenExpiresIn: response.accessTokenExpiresIn,
      refreshTokenExpiresIn: response.refreshTokenExpiresIn,
    }, () => operations.current(generation));
    if (!stored || !operations.current(generation)) {
      await logoutRequest(response.refreshToken).catch(() => undefined);
      throw new ApiError('Session changed.', 'unauthorized', 401);
    }
    clearSessionExpiredNotice();
    let currentUser: AuthenticatedUser;
    try {
      currentUser = await getCurrentUser();
      if (operations.current(generation)) await beforeAuthenticated();
    } catch (error) {
      if (operations.current(generation)) {
        await authTokenStorage.clear().catch(() => undefined);
        await logoutRequest(response.refreshToken).catch(() => undefined);
      }
      throw error;
    }
    if (!operations.current(generation)) throw new ApiError('Session changed.', 'unauthorized', 401);
    if (remember && currentUser.email !== normalizedEmail) {
      await rememberedEmailStorage.write(currentUser.email).catch(() => undefined);
      setRememberedEmail(currentUser.email);
    }
    if (!operations.current(generation)) throw new ApiError('Session changed.', 'unauthorized', 401);
    setUser(currentUser);
    setStatus('authenticated');
  }, [beforeAuthenticated, operations]);

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
    operations.begin();
    const serverLogout = logoutNativeSession().catch(() => false);
    setUser(null);
    setStatus('unauthenticated');
    const savedEmail = await rememberedEmailStorage.read().catch(() => ({ rememberMe: false, email: null }));
    if (!savedEmail.rememberMe) {
      await rememberedEmailStorage.clear().catch(() => undefined);
      setRememberedEmail(null);
      setRememberMe(false);
    }
    setUser(null);
    setStatus('unauthenticated');
    return raceWithTimeout(serverLogout, 2500);
  }, [operations]);

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

function createAuthOperations() {
  let generation = 0;
  let profileRequest = 0;
  return {
    begin: () => ++generation,
    generation: () => generation,
    read: () => ++profileRequest,
    current: (version: number, request = profileRequest) => version === generation && request === profileRequest,
  };
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
