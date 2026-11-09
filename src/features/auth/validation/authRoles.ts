import type { AuthenticatedUser, UserRole } from '@/features/auth/types/auth';

export function isAdmin(user: AuthenticatedUser | null): boolean {
  return user?.role === 'ADMIN' && (user.roles === undefined || user.roles.includes('ADMIN'));
}

export function isUser(user: AuthenticatedUser | null): boolean {
  return user?.role === 'USER' && (user.roles === undefined || user.roles.includes('USER'));
}

export function hasRole(user: AuthenticatedUser | null, role: UserRole): boolean {
  return user?.role === role && (user.roles === undefined || user.roles.includes(role));
}
