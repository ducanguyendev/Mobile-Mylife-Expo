import type { FamilyMember } from '@/features/family/types/family';
import type { Language } from '@/preferences/preferences';
export type Anniversary = { id: number; title: string; nextSolarDate: string; daysUntil: number };
export type Album = { id: number; name: string; photoCount: number; createdAt: string; updatedAt: string };
export type HomeData = { family: FamilyMember[]; anniversaries: Anniversary[]; albums: Album[] };
export type Section = keyof HomeData;
export function familySummary(members: FamilyMember[]) {
  return { count: members.length, generations: new Set(members.map((member) => member.generation).filter((n) => Number.isInteger(n) && n > 0)).size, previews: members.slice(0, 3) };
}
export function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}
export function formatDateOnly(value: string, language: Language): string | null {
  const date = parseDateOnly(value);
  // Calendar date, never an instant in the device timezone.
  return date ? new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'vi-VN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date) : null;
}
export function vietnamDateKey(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function upcomingAnniversaries(events: Anniversary[], now: Date) {
  // Backend owns the next occurrence/lunar conversion. Discard dates that became
  // past while open without inventing another occurrence.
  const today = vietnamDateKey(now);
  return events.filter((event) => parseDateOnly(event.nextSolarDate) && event.nextSolarDate >= today)
    .slice().sort((a, b) => a.nextSolarDate.localeCompare(b.nextSolarDate) || a.id - b.id).slice(0, 3);
}
export function recentAlbums(albums: Album[]) {
  const time = (value: string) => Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
  return albums.slice().sort((a, b) => time(b.updatedAt || b.createdAt) - time(a.updatedAt || a.createdAt) || b.id - a.id).slice(0, 3);
}
export function greetingPeriod(now: Date): 'morning' | 'afternoon' | 'evening' {
  const hour = now.getHours();
  return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
}
