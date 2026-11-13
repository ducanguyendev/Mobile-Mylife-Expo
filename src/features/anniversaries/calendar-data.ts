import { dateParts } from '@/features/timeline/timeline-data';
import type { Anniversary } from './anniversary-data';

export type CalendarMonth = { year: number; month: number };
export type CalendarDay = { date: string; day: number; inMonth: boolean };
export function calendarMonthValid(value: CalendarMonth): boolean {
  return Number.isInteger(value.year) && value.year >= 1800 && value.year <= 2200
    && Number.isInteger(value.month) && value.month >= 1 && value.month <= 12;
}
export function dateMonth(value: string): CalendarMonth {
  const parts = dateParts(value);
  if (!parts) throw new Error('ANNIVERSARY_INVALID_DATE');
  return { year: parts.year, month: parts.month };
}
export function moveCalendarMonth(value: CalendarMonth, delta: number): CalendarMonth {
  const index = value.year * 12 + value.month - 1 + delta;
  return { year: Math.floor(index / 12), month: index % 12 + 1 };
}
export function calendarGrid(value: CalendarMonth): CalendarDay[] {
  if (!calendarMonthValid(value)) throw new Error('ANNIVERSARY_INVALID_MONTH');
  const first = new Date(`${value.year}-${String(value.month).padStart(2, '0')}-01T12:00:00Z`);
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const last = new Date(first);
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  const cells = Math.ceil((mondayOffset + last.getUTCDate()) / 7) * 7;
  return Array.from({ length: cells }, (_, index) => {
    const date = new Date(first);
    date.setUTCDate(index - mondayOffset + 1);
    return { date: date.toISOString().slice(0, 10), day: date.getUTCDate(), inMonth: date.getUTCMonth() + 1 === value.month };
  });
}
export function eventsByNextDate(items: Anniversary[]): Map<string, Anniversary[]> {
  const grouped = new Map<string, Anniversary[]>();
  for (const item of items) {
    const sameDate = grouped.get(item.nextSolarDate) ?? [];
    sameDate.push(item);
    grouped.set(item.nextSolarDate, sameDate);
  }
  return grouped;
}
