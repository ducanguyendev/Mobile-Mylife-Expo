import type { AuthenticatedUser, UserRole } from '@/features/auth/types/auth';
import { account } from '@/features/profile/profile-data';
export type AdminStats = { totalUsers: number; totalActive: number; totalLocked: number; last7Days: { successLogins: number; failedLogins: number; newRegistrations: number } };
export type LoginLog = { id: number; attemptEmail: string; status: 'SUCCESS' | 'FAILED' | 'REGISTERED'; ipAddress: string | null; createdAt: string };
export type UserSort = 'newest' | 'oldest' | 'emailAsc' | 'emailDesc';
export type StatusFilter = 'all' | 'active' | 'locked';
export function stats(value: unknown): AdminStats {
  const data = value as AdminStats | null;
  if (!data || [data.totalUsers, data.totalActive, data.totalLocked, data.last7Days?.successLogins, data.last7Days?.failedLogins, data.last7Days?.newRegistrations].some(n => !Number.isSafeInteger(n) || n < 0)
    || data.totalActive + data.totalLocked !== data.totalUsers) throw Error('INVALID_DATA');
  return data;
}
export function collection<T extends { id: number }>(value: unknown, parse: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) throw Error('INVALID_DATA');
  const items = value.map(parse);
  if (new Set(items.map(item => item.id)).size !== items.length) throw Error('INVALID_DATA');
  return items;
}
export const users = (value: unknown) => collection(value, account);
export function log(value: unknown): LoginLog {
  const item = value as LoginLog;
  if (!item || !Number.isSafeInteger(item.id) || item.id <= 0 || typeof item.attemptEmail !== 'string' || !['SUCCESS', 'FAILED', 'REGISTERED'].includes(item.status)
    || (item.ipAddress !== null && typeof item.ipAddress !== 'string') || typeof item.createdAt !== 'string' || !Number.isFinite(Date.parse(item.createdAt))) throw Error('INVALID_DATA');
  return item;
}
const search = (value: string) => value.trim().toLocaleLowerCase();
const time = (value?: string | null) => value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
export function selectUsers(items: AuthenticatedUser[], term: string, role: 'all' | UserRole, status: StatusFilter, sort: UserSort) {
  return items.filter(item => search(item.email).includes(search(term)) && (role === 'all' || item.role === role) && (status === 'all' || item.isActive === (status === 'active')))
    .sort((a, b) => {
      const order = sort === 'emailAsc' || sort === 'emailDesc' ? search(a.email).localeCompare(search(b.email)) * (sort === 'emailDesc' ? -1 : 1) : (time(b.createdAt) - time(a.createdAt)) * (sort === 'oldest' ? -1 : 1);
      return order || a.id - b.id;
    });
}
export function selectLogs(items: LoginLog[], term: string, status: 'all' | LoginLog['status'], sort: 'newest' | 'oldest') {
  return items.filter(item => search(item.attemptEmail).includes(search(term)) && (status === 'all' || item.status === status))
    .sort((a, b) => (time(b.createdAt) - time(a.createdAt)) * (sort === 'oldest' ? -1 : 1) || b.id - a.id);
}
export function canAdminister(actor: number, target: AuthenticatedUser, action: 'role' | 'status' | 'delete') {
  return target.id !== actor && (action === 'role' || target.role !== 'ADMIN');
}
