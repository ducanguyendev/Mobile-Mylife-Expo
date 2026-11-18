import { apiRequest } from '@/api/apiClient';
import type { AuthenticatedUser, LoginResponse, RegistrationInput } from '@/features/auth/types/auth';
import { account } from '@/features/profile/profile-data';

export function loginRequest(email: string, password: string, rememberMe: boolean) {
  return apiRequest<LoginResponse>('/api/login', {
    method: 'POST',
    authenticated: false,
    retryOnUnauthorized: false,
    body: JSON.stringify({ email, password, rememberMe }),
  });
}

// Native Google sign-in sends the Google ID token; the backend verifies it and
// returns the same native token pair as /api/login. The web flow instead sends
// an authorization code plus redirect URI to this same endpoint.
export function googleLoginRequest(idToken: string) {
  return apiRequest<LoginResponse>('/api/auth/google', {
    method: 'POST',
    authenticated: false,
    retryOnUnauthorized: false,
    body: JSON.stringify({ idToken }),
  });
}

export function registerRequest(input: RegistrationInput) {
  return apiRequest<{ success: true; message: string; email: string }>('/api/auth/register', {
    method: 'POST', authenticated: false, retryOnUnauthorized: false, body: JSON.stringify(input),
  });
}

export async function getCurrentUser() {
  const user = account(await apiRequest<AuthenticatedUser>('/api/me', { coalesce: true }));
  if (!user.isActive) throw Error('Inactive account');
  return user;
}

export function logoutRequest(refreshToken: string) {
  return apiRequest<{ success: true }>('/api/logout', {
    method: 'POST', authenticated: false, retryOnUnauthorized: false, body: JSON.stringify({ refreshToken }),
  });
}
