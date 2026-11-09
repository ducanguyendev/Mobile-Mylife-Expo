import { apiRequest } from '@/api/apiClient';
import type { AuthenticatedUser, LoginResponse, RegistrationInput } from '@/features/auth/types/auth';

export function loginRequest(email: string, password: string, rememberMe: boolean) {
  return apiRequest<LoginResponse>('/api/login', {
    method: 'POST',
    authenticated: false,
    retryOnUnauthorized: false,
    body: JSON.stringify({ email, password, rememberMe }),
  });
}

export function registerRequest(input: RegistrationInput) {
  return apiRequest<{ success: true; message: string; email: string }>('/api/auth/register', {
    method: 'POST', authenticated: false, retryOnUnauthorized: false, body: JSON.stringify(input),
  });
}

export function getCurrentUser() {
  return apiRequest<AuthenticatedUser>('/api/me');
}

export function logoutRequest(refreshToken: string) {
  return apiRequest<{ success: true }>('/api/logout', {
    method: 'POST', authenticated: false, retryOnUnauthorized: false, body: JSON.stringify({ refreshToken }),
  });
}
