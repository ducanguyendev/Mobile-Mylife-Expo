export type UserRole = 'USER' | 'ADMIN';

export interface AuthenticatedUser {
  id: number;
  email: string;
  fullName?: string | null;
  displayName?: string | null;
  name?: string | null;
  phoneNumber?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  roles?: UserRole[];
  authProvider?: number;
  authProviderName?: string | null;
  loginProviders?: { local: boolean; google: boolean };
  isActive: boolean;
  verifiedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

export interface LoginResponse extends AuthTokens {
  success: true;
  message: string;
  user: AuthenticatedUser;
}

export type RegistrationInput = {
  fullName: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';
