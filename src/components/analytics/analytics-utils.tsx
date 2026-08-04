import type { Primitive, TerminalCapacityRecord } from './analytics-types';

export function unwrapDynamoValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(unwrapDynamoValue);
  if (!value || typeof value !== 'object') return value as Primitive;

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);

  if (keys.length === 1) {
    if ('S' in obj) return obj.S;
    if ('N' in obj) return Number(obj.N);
    if ('BOOL' in obj) return Boolean(obj.BOOL);
    if ('NULL' in obj) return null;
    if ('L' in obj && Array.isArray(obj.L)) return obj.L.map(unwrapDynamoValue);
    if ('M' in obj && obj.M && typeof obj.M === 'object') {
      return Object.fromEntries(
        Object.entries(obj.M as Record<string, unknown>).map(([k, v]) => [k, unwrapDynamoValue(v)])
      );
    }
  }

  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, unwrapDynamoValue(v)]));
}

export function parseDateInput(value: unknown): Date | null {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;

  const isoAttempt = new Date(text);
  if (!Number.isNaN(isoAttempt.getTime())) return isoAttempt;

  const usDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usDate) {
    const [, month, day, year] = usDate;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return null;
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function diffInDays(later: Date, earlier: Date): number {
  return Math.floor((startOfDay(later).getTime() - startOfDay(earlier).getTime()) / (1000 * 60 * 60 * 24));
}

export function diffInMonths(later: Date, earlier: Date): number {
  return (later.getFullYear() - earlier.getFullYear()) * 12 + (later.getMonth() - earlier.getMonth());
}

export function weekdayToNumber(day: string): number | null {
  const map: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    thrusday: 4,
  };
  return map[day.toLowerCase()] ?? null;
}

export function matchesNthWeekday(date: Date, weekNumberRaw: unknown, dayRaw: unknown): boolean {
  const weekNumber = String(weekNumberRaw || '').toLowerCase();
  const dayNum = weekdayToNumber(String(dayRaw || ''));
  if (dayNum === null || date.getDay() !== dayNum) return false;

  const year = date.getFullYear();
  const month = date.getMonth();
  const allDates: number[] = [];
  const cursor = new Date(year, month, 1);
  while (cursor.getMonth() === month) {
    if (cursor.getDay() === dayNum) allDates.push(cursor.getDate());
    cursor.setDate(cursor.getDate() + 1);
  }

  const currentDate = date.getDate();
  if (weekNumber === 'first') return currentDate === allDates[0];
  if (weekNumber === 'second') return currentDate === allDates[1];
  if (weekNumber === 'third') return currentDate === allDates[2];
  if (weekNumber === 'fourth') return currentDate === allDates[3];
  if (weekNumber === 'last') return currentDate === allDates[allDates.length - 1];
  return false;
}

export function appliesOnDate(record: TerminalCapacityRecord, day: Date): boolean {
  if (!record.isActive || record.capacity <= 0 || !record.startDate) return false;

  const target = startOfDay(day);
  const start = startOfDay(record.startDate);
  const end = record.endDate ? startOfDay(record.endDate) : null;

  if (target < start) return false;
  if (end && target > end) return false;

  const repeat = record.repeat.toLowerCase();
  const dayDiff = diffInDays(target, start);
  const weekDiff = Math.floor(dayDiff / 7);
  const monthDiff = diffInMonths(target, start);

  if (!repeat || repeat === 'never') return dayDiff === 0;
  if (repeat === 'daily') return true;
  if (repeat === 'weekdays') return target.getDay() >= 1 && target.getDay() <= 5;
  if (repeat === 'weekends') return target.getDay() === 0 || target.getDay() === 6;
  if (repeat === 'weekly') return target.getDay() === start.getDay() && weekDiff % 1 === 0;
  if (repeat === 'biweekly') return target.getDay() === start.getDay() && weekDiff % 2 === 0;
  if (repeat === 'monthly') return target.getDate() === start.getDate() && monthDiff % 1 === 0;
  if (repeat === 'every 3 months') return target.getDate() === start.getDate() && monthDiff % 3 === 0;
  if (repeat === 'every 6 months') return target.getDate() === start.getDate() && monthDiff % 6 === 0;
  if (repeat === 'yearly') {
    return target.getDate() === start.getDate() && target.getMonth() === start.getMonth();
  }

  if (repeat !== 'custom') return true;

  const config = record.repeatConfig;
  const frequency = String(config.frequency || '').toLowerCase();
  const interval = Number(config.interval || 1) || 1;
  const daysOfWeek = (config.daysOfWeek as unknown[] | undefined)
    ?.map((d) => weekdayToNumber(String(d)))
    .filter((d): d is number => d !== null) || [];
  const daysOfMonth = (config.daysOfMonth as unknown[] | undefined)
    ?.map((d) => Number(d))
    .filter((d) => Number.isFinite(d)) || [];

  if (frequency === 'daily') return dayDiff % interval === 0;

  if (frequency === 'weekly') {
    const allowedDays = daysOfWeek.length > 0 ? daysOfWeek : [start.getDay()];
    return weekDiff % interval === 0 && allowedDays.includes(target.getDay());
  }

  if (frequency === 'monthly') {
    if (monthDiff % interval !== 0) return false;
    if (daysOfMonth.length > 0) return daysOfMonth.includes(target.getDate());
    if (config.weekNumber && config.dayOfWeek) {
      return matchesNthWeekday(target, config.weekNumber, config.dayOfWeek);
    }
    return target.getDate() === start.getDate();
  }

  if (frequency === 'yearly') {
    const yearDiff = target.getFullYear() - start.getFullYear();
    if (yearDiff % interval !== 0) return false;

    const months = (config.months as unknown[] | undefined)
      ?.map((monthName) => {
        const monthMap: Record<string, number> = {
          january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
          july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
        };
        return monthMap[String(monthName).toLowerCase()] ?? -1;
      })
      .filter((monthNum) => monthNum >= 0) || [];

    if (months.length > 0 && !months.includes(target.getMonth())) return false;
    if (daysOfMonth.length > 0) return daysOfMonth.includes(target.getDate());
    if (config.weekNumber && config.dayOfWeek) {
      return matchesNthWeekday(target, config.weekNumber, config.dayOfWeek);
    }
    return target.getDate() === start.getDate();
  }

  return true;
}

export const ANALYTICS_CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];
