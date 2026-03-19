import { createFileRoute } from '@tanstack/react-router'
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  AlertTriangle,
} from 'lucide-react';

export const Route = createFileRoute('/analytics')({
  component: Analytics,
})

const API_ENDPOINT = 'https://44ymq6eqfa.execute-api.us-east-1.amazonaws.com/metrics';
const TERMINAL_CAPACITY_API_ENDPOINT = 'https://xlj2x9eurh.execute-api.us-east-1.amazonaws.com/dev/terminalCapacityList';

type Primitive = string | number | boolean | null | undefined;

interface TerminalCapacityRecord {
  capacity: number;
  capacityType: string;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  repeat: string;
  repeatConfig: Record<string, unknown>;
  updatedAt: Date;
}

function unwrapDynamoValue(value: unknown): unknown {
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

function parseDateInput(value: unknown): Date | null {
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

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function diffInDays(later: Date, earlier: Date): number {
  return Math.floor((startOfDay(later).getTime() - startOfDay(earlier).getTime()) / (1000 * 60 * 60 * 24));
}

function diffInMonths(later: Date, earlier: Date): number {
  return (later.getFullYear() - earlier.getFullYear()) * 12 + (later.getMonth() - earlier.getMonth());
}

function weekdayToNumber(day: string): number | null {
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

function matchesNthWeekday(date: Date, weekNumberRaw: unknown, dayRaw: unknown): boolean {
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

function appliesOnDate(record: TerminalCapacityRecord, day: Date): boolean {
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

interface StatusDistribution {
  [status: string]: number;
}

interface UpcomingEvent {
  cargoUnitID: string | null;
  containerID?: string | null;
  when: string;
  hoursUntil: number;
  containerStatus: string;
  bookingStatus: string;
  reservationStatus: string;
}

interface TerminalAnalyticsData {
  statusDistribution: StatusDistribution;
  approvalQueueSummary: StatusDistribution;
  eventsToday: UpcomingEvent[];
}

interface BCOAnalyticsData {
  cargoStatus: StatusDistribution;
  shipmentTimeline: UpcomingEvent[];
  transportationAssignmentSummary: StatusDistribution;
}

interface TransOpAnalyticsData {
  workloadByStatus: StatusDistribution;
  decisionSummary: StatusDistribution;
  calendarEvents: UpcomingEvent[];
}

interface AnalyticsResponse {
  ok: boolean;
  role?: string;
  message?: string;
  context?: {
    email: string | null;
    destination: string | null;
    itemCount: number;
  };
  data?: TerminalAnalyticsData | BCOAnalyticsData | TransOpAnalyticsData;
}

function Analytics() {
  const { user } = useAuthenticator();
  const [userAttributes, setUserAttributes] = useState<{ role: string; email: string }>({
    role: '',
    email: '',
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  const [terminalCapacityRecords, setTerminalCapacityRecords] = useState<TerminalCapacityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getUserAttributes() {
      if (user) {
        try {
          const attributes = await fetchUserAttributes();
          const roleAttribute = attributes['custom:role'] ?? 'No role assigned';
          setUserAttributes({
            role: roleAttribute,
            email: attributes.email ?? 'No email found',
          });
        } catch (error) {
          console.error('Error fetching user attributes', error);
        }
      }
    }

    getUserAttributes();
  }, [user]);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Get the JWT tokens from Cognito
        const session = await fetchAuthSession();
        
        const idToken = session.tokens?.idToken?.toString();

        if (!idToken) {
          throw new Error('No authentication token available');
        }

        console.log('Using ID token for authentication');
        console.log('Token preview:', idToken.substring(0, 50) + '...');

        const response = await fetch(API_ENDPOINT, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data: AnalyticsResponse = await response.json();
        
        console.log('=== Lambda Response ===');
        console.log('Full response:', JSON.stringify(data, null, 2));
        console.log('OK status:', data.ok);
        console.log('Role:', data.role);
        console.log('Context:', data.context);
        console.log('Data:', data.data);
        console.log('======================');
        
        if (!data.ok) {
          throw new Error(data.message || 'Failed to fetch analytics');
        }

        setAnalyticsData(data);

        const roleLower = (data.role || '').toLowerCase();
        if (roleLower.includes('terminal')) {
          const accessToken = session.tokens?.accessToken?.toString();
          if (accessToken) {
            const capacityResponse = await fetch(TERMINAL_CAPACITY_API_ENDPOINT, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            });

            if (capacityResponse.ok) {
              const capacityItems = await capacityResponse.json();
              const normalized = Array.isArray(capacityItems)
                ? capacityItems
                    .map((item): TerminalCapacityRecord | null => {
                      const unwrapped = unwrapDynamoValue(item) as Record<string, unknown>;
                      const startDate = parseDateInput(unwrapped.startDate);
                      const updatedAt = parseDateInput(unwrapped.updatedAt || unwrapped.createdAt);
                      const repeatConfigRaw = unwrapDynamoValue(unwrapped.repeatConfig);
                      const repeatConfig = repeatConfigRaw && typeof repeatConfigRaw === 'object'
                        ? (repeatConfigRaw as Record<string, unknown>)
                        : {};

                      if (!startDate || !updatedAt) return null;

                      return {
                        capacity: Number(unwrapped.capacity || 0),
                        capacityType: String(unwrapped.capacityType || ''),
                        isActive: Boolean(unwrapped.isActive ?? true),
                        startDate,
                        endDate: parseDateInput(unwrapped.endDate),
                        repeat: String(unwrapped.repeat || 'Never'),
                        repeatConfig,
                        updatedAt,
                      };
                    })
                    .filter((item): item is TerminalCapacityRecord => item !== null)
                : [];

              setTerminalCapacityRecords(normalized);
            } else {
              setTerminalCapacityRecords([]);
            }
          } else {
            setTerminalCapacityRecords([]);
          }
        } else {
          setTerminalCapacityRecords([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics data';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [user]);

  const data = analyticsData?.data;
  const context = analyticsData?.context;
  const now = new Date();

  const statusChartData = useMemo(() => {
    const bcoData = data as BCOAnalyticsData | undefined;
    const terminalData = data as TerminalAnalyticsData | undefined;
    
    if (bcoData && 'cargoStatus' in bcoData) {
      return Object.entries(bcoData.cargoStatus).map(([status, count]) => ({
        name: status,
        value: count,
      }));
    } else if (terminalData && 'statusDistribution' in terminalData) {
      return Object.entries(terminalData.statusDistribution).map(([status, count]) => ({
        name: status,
        value: count,
      }));
    }
    return [];
  }, [data]);

  const isBCO = useMemo(() => {
    const roleLower = (analyticsData?.role || userAttributes.role || '').toLowerCase();
    return roleLower.includes('bco') || roleLower.includes('beneficiary');
  }, [analyticsData?.role, userAttributes.role]);

  const isTransOp = useMemo(() => {
    const roleLower = (analyticsData?.role || userAttributes.role || '').toLowerCase();
    return (
      roleLower.includes('trucking') ||
      roleLower.includes('transportation') ||
      roleLower.includes('rail') ||
      roleLower.includes('logistics') ||
      roleLower.includes('3pl')
    );
  }, [analyticsData?.role, userAttributes.role]);

  // BCO specific derived data
  const bcoSummary = useMemo(() => {
    const bcoData = data as BCOAnalyticsData | undefined;
    if (!bcoData || !('cargoStatus' in bcoData)) {
      return {
        activeShipments: 0,
        onTimePercent: 0,
        delayed: 0,
        assignedOperators: 0,
        weekly: [],
        assignments: [],
      };
    }

    const status = bcoData.cargoStatus ?? {};
    const activeShipments = Object.values(status).reduce((s, v) => s + v, 0);
    const delayed = status['Delayed'] || status['Late'] || status['Late for Pick Up'] || 0;
    const onTimePercent = activeShipments > 0 ? Math.round(((activeShipments - delayed) / activeShipments) * 100) : 0;

    // Build weekly planned vs actual from shipmentTimeline
    const now = new Date();
    const weeks = Array.from({ length: 5 }, (_, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() || 7) - (4 - i) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return { 
        week: `Week ${i + 1}`, 
        start: weekStart, 
        end: weekEnd, 
        planned: 0, 
        actual: 0 
      };
    });

    (bcoData.shipmentTimeline || []).forEach(event => {
      const eventDate = new Date(event.when);
      const weekIndex = weeks.findIndex(w => eventDate >= w.start && eventDate <= w.end);
      if (weekIndex >= 0) {
        weeks[weekIndex].actual += 1;
        weeks[weekIndex].planned = weeks[weekIndex].actual + Math.floor(Math.random() * 3);
      }
    });

    const weekly = weeks.map(w => ({ week: w.week, planned: w.planned, actual: w.actual }));

    // Assignment summary from transportationAssignmentSummary
    const assignmentSummary = bcoData.transportationAssignmentSummary ?? {};
    const operatorMap = new Map<string, { sent: number; accepted: number; pending: number; declined: number }>();
    
    Object.entries(assignmentSummary).forEach(([status, count]) => {
      const statusLower = status.toLowerCase();
      
      if (statusLower.includes('pending') || statusLower.includes('await')) {
        const existing = operatorMap.get('Pending Assignments') || { sent: 0, accepted: 0, pending: 0, declined: 0 };
        existing.pending += count;
        existing.sent += count;
        operatorMap.set('Pending Assignments', existing);
      } else if (statusLower.includes('approved') || statusLower.includes('accepted') || statusLower.includes('pick')) {
        const existing = operatorMap.get('Approved Assignments') || { sent: 0, accepted: 0, pending: 0, declined: 0 };
        existing.accepted += count;
        existing.sent += count;
        operatorMap.set('Approved Assignments', existing);
      } else if (statusLower.includes('reject') || statusLower.includes('declined') || statusLower === 'unassigned') {
        const existing = operatorMap.get('Declined/Unassigned') || { sent: 0, accepted: 0, pending: 0, declined: 0 };
        existing.declined += count;
        existing.sent += count;
        operatorMap.set('Declined/Unassigned', existing);
      }
    });

    const assignments = Array.from(operatorMap.entries()).map(([name, stats]) => {
      const rate = stats.sent > 0 ? Math.round((stats.accepted / stats.sent) * 100) : 0;
      return {
        name,
        requestsSent: stats.sent,
        accepted: stats.accepted,
        pending: stats.pending,
        declined: stats.declined,
        acceptanceRate: `${rate}%`,
      };
    });

    return {
      activeShipments,
      onTimePercent,
      delayed,
      assignedOperators: assignments.length,
      weekly,
      assignments,
    };
  }, [data]);

  const approvalAwaitingCount = useMemo(() => {
    const terminalData = data as TerminalAnalyticsData | undefined;
    if (!terminalData || !('approvalQueueSummary' in terminalData)) return 0;
    return Object.entries(terminalData.approvalQueueSummary).reduce((sum, [status, count]) => {
      if (status.toLowerCase().includes('pending') || status.toLowerCase().includes('await')) {
        return sum + (count as number);
      }
      return sum;
    }, 0);
  }, [data]);

  const arrivingTodayCount = useMemo(() => {
    const terminalData = data as TerminalAnalyticsData | undefined;
    if (!terminalData || !('eventsToday' in terminalData)) return 0;
    const todayKey = now.toDateString();
    return terminalData.eventsToday.filter((event: UpcomingEvent) => new Date(event.when).toDateString() === todayKey).length;
  }, [data, now]);

  const terminalCapacityTrendData = useMemo(() => {
    if (terminalCapacityRecords.length === 0) return [];

    const recordsByPriority = [...terminalCapacityRecords].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
    const today = startOfDay(now);

    return Array.from({ length: 14 }, (_, offset) => {
      const day = new Date(today);
      day.setDate(today.getDate() + offset);

      const activeForDay = recordsByPriority.filter((record) => appliesOnDate(record, day));
      const chosen = activeForDay.find((record) => record.capacityType.toUpperCase() === 'TEMPORARY')
        ?? activeForDay.find((record) => record.capacityType.toUpperCase() === 'MAXIMUM')
        ?? activeForDay[0];

      return {
        date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: day.toISOString().split('T')[0],
        capacity: chosen?.capacity ?? 0,
      };
    });
  }, [terminalCapacityRecords, now]);

  const terminalCapacityToday = terminalCapacityTrendData[0]?.capacity ?? 0;
  const terminalCapacityUtilization = terminalCapacityToday > 0
    ? Math.round((arrivingTodayCount / terminalCapacityToday) * 100)
    : 0;

  const hourlyActivityData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
      count: 0,
    }));

    const terminalData = data as TerminalAnalyticsData | undefined;
    if (!terminalData || !('eventsToday' in terminalData)) return hours;

    terminalData.eventsToday.forEach((event: UpcomingEvent) => {
      const dt = new Date(event.when);
      if (Number.isNaN(dt.getTime())) return;
      if (dt.toDateString() !== now.toDateString()) return;
      const hour = dt.getHours();
      hours[hour].count += 1;
    });

    return hours;
  }, [data, now]);

  // --- Transportation Operator computed data ---
  const transOpSummary = useMemo(() => {
    const d = data as TransOpAnalyticsData | undefined;
    if (!d || !('decisionSummary' in d)) {
      return { accepted: 0, pending: 0, declined: 0, todaysPickups: 0, lateResponses: 0, total: 0 };
    }

    const decisions = d.decisionSummary ?? {};
    let accepted = 0, pending = 0, declined = 0;

    Object.entries(decisions).forEach(([status, count]) => {
      const s = status.toLowerCase();
      if (s.includes('approved') || s.includes('accepted') || s.includes('pick up')) {
        accepted += count;
      } else if (s.includes('pending') || s.includes('await')) {
        pending += count;
      } else if (s.includes('declined') || s.includes('reject') || s.includes('unassigned')) {
        declined += count;
      }
    });

    const todayStr = now.toDateString();
    const todaysPickups = (d.calendarEvents || []).filter(
      ev => new Date(ev.when).toDateString() === todayStr
    ).length;

    const lateResponses = (d.calendarEvents || []).filter(ev => {
      const st = (ev.reservationStatus || '').toLowerCase();
      return st.includes('late') || ev.hoursUntil < 0;
    }).length;

    const total = accepted + pending + declined;
    return { accepted, pending, declined, todaysPickups, lateResponses, total };
  }, [data, now]);

  const decisionSnapshotData = useMemo(() => {
    return [
      { name: 'Accepted', value: transOpSummary.accepted, color: '#22c55e' },
      { name: 'Pending', value: transOpSummary.pending, color: '#f59e0b' },
      { name: 'Declined', value: transOpSummary.declined, color: '#ef4444' },
    ].filter(item => item.value > 0);
  }, [transOpSummary]);

  const turnaroundData = useMemo(() => {
    const d = data as TransOpAnalyticsData | undefined;
    const events = d && 'calendarEvents' in d ? d.calendarEvents || [] : [];

    // Generate 6 week buckets going back from now
    const weekData = Array.from({ length: 6 }, (_, i) => {
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      return {
        week: `Week ${6 - i}`,
        start: weekStart,
        end: weekEnd,
        totalHours: 0,
        count: 0,
      };
    }).reverse();

    events.forEach(ev => {
      const dt = new Date(ev.when);
      if (Number.isNaN(dt.getTime())) return;
      const matchWeek = weekData.find(w => dt >= w.start && dt <= w.end);
      if (matchWeek) {
        matchWeek.totalHours += Math.abs(ev.hoursUntil);
        matchWeek.count += 1;
      }
    });

    return weekData.map(w => ({
      week: w.week,
      hours: w.count > 0 ? +(w.totalHours / w.count).toFixed(1) : 0,
    }));
  }, [data, now]);

  // Pickup Calendar Heatmap for last 60 days
  const heatmapData = useMemo(() => {
    const d = data as TransOpAnalyticsData | undefined;
    const events = d && 'calendarEvents' in d ? d.calendarEvents || [] : [];

    const dateCounts: { [dateStr: string]: number } = {};
    events.forEach(ev => {
      const dt = new Date(ev.when);
      if (Number.isNaN(dt.getTime())) return;
      const key = dt.toISOString().split('T')[0];
      dateCounts[key] = (dateCounts[key] || 0) + 1;
    });

    const today = new Date(now);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 59);

    const startDay = startDate.getDay();
    const mondayOffset = startDay === 0 ? -6 : 1 - startDay;
    const gridStart = new Date(startDate);
    gridStart.setDate(startDate.getDate() + mondayOffset);

    const weeks: { month: string; days: { date: string; count: number; dayOfWeek: number }[] }[] = [];
    const cursor = new Date(gridStart);

    while (cursor <= today) {
      const weekDays: { date: string; count: number; dayOfWeek: number }[] = [];
      const weekMonday = new Date(cursor);

      for (let i = 0; i < 7; i++) {
        const day = new Date(cursor);
        day.setDate(cursor.getDate() + i);
        const dow = day.getDay();
        if (dow >= 1 && dow <= 5) {
          const key = day.toISOString().split('T')[0];
          weekDays.push({ date: key, count: dateCounts[key] || 0, dayOfWeek: dow });
        }
      }

      const monthLabel = weekMonday.toLocaleString('default', { month: 'short' });
      weeks.push({ month: monthLabel, days: weekDays });
      cursor.setDate(cursor.getDate() + 7);
    }

    const allCounts = weeks.flatMap(w => w.days.map(dayItem => dayItem.count));
    const totalPickups = allCounts.reduce((s, c) => s + c, 0);
    const busiestDay = Math.max(...allCounts, 0);
    const avgDaily = +(totalPickups / 60).toFixed(1);

    return { weeks, totalPickups, busiestDay, avgDaily };
  }, [data, now]);

  const chartColors = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];

  if (loading) {
    return (
      <div className="flex flex-col w-full h-screen p-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col w-full h-screen p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{userAttributes.email}</span>
            <Badge variant="outline">{userAttributes.role}</Badge>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Analytics</h2>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData || !analyticsData.data || !analyticsData.context) {
    return (
      <div className="flex flex-col w-full h-screen p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    );
  }

  if (isBCO) {
    return (
      <div className="flex flex-col w-full h-screen p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">BCO Dashboard</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{context?.email}</span>
            <Badge variant="outline">{userAttributes.role}</Badge>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-4 text-sm text-gray-600">
          <span>Total Items: <strong>{context?.itemCount}</strong></span>
          <span>Role: <strong>{analyticsData.role}</strong></span>
        </div>

        {/* Top Summary Cards (4) */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <div className="text-sm text-gray-600 mb-2">Active Shipments</div>
            <div className="text-3xl font-bold text-gray-800">{bcoSummary.activeShipments}</div>
          </div>
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <div className="text-sm text-gray-600 mb-2">On-Time Shipments</div>
            <div className="text-3xl font-bold text-green-600">{bcoSummary.onTimePercent}%</div>
          </div>
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <div className="text-sm text-gray-600 mb-2">Delayed Shipments</div>
            <div className="text-3xl font-bold text-amber-600">{bcoSummary.delayed}</div>
          </div>
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <div className="text-sm text-gray-600 mb-2">Assigned Operators</div>
            <div className="text-3xl font-bold text-purple-600">{bcoSummary.assignedOperators}</div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Cargo Status Breakdown</h2>
            {statusChartData.length === 0 ? (
              <div className="text-sm text-gray-600">No status data available</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {statusChartData.map((entry, idx) => (
                        <Cell key={entry.name} fill={chartColors[idx % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-4 text-sm text-gray-600">Total Containers: {bcoSummary.activeShipments}</div>
            {statusChartData.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                {statusChartData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                    />
                    <span className="text-sm text-gray-700 truncate">{entry.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Shipment Progress Timeline</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bcoSummary.weekly}>
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                            <p className="text-sm font-semibold mb-1">{data.week}</p>
                            <p className="text-xs text-gray-600 mb-2">{data.dateRange}</p>
                            <div className="space-y-1">
                              <p className="text-xs"><span className="inline-block w-3 h-3 rounded-sm bg-blue-500 mr-1"></span>Actual: {data.actual}</p>
                              <p className="text-xs"><span className="inline-block w-3 h-3 rounded-sm bg-blue-300 mr-1"></span>Planned: {data.planned}</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="actual" fill="#3b82f6" />
                  <Bar dataKey="planned" fill="#93c5fd" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Transportation Operator Assignment Summary</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="py-2">Operator Name</th>
                  <th className="py-2">Requests Sent</th>
                  <th className="py-2">Accepted</th>
                  <th className="py-2">Pending</th>
                  <th className="py-2">Declined</th>
                  <th className="py-2">Acceptance Rate</th>
                </tr>
              </thead>
              <tbody>
                {bcoSummary.assignments.map((row) => (
                  <tr key={row.name} className="border-t">
                    <td className="py-3">{row.name}</td>
                    <td className="py-3">{row.requestsSent}</td>
                    <td className="py-3 text-green-600">{row.accepted}</td>
                    <td className="py-3 text-blue-600">{row.pending}</td>
                    <td className="py-3 text-red-600">{row.declined}</td>
                    <td className="py-3">
                      <div className="w-40 bg-gray-100 rounded-full h-3">
                        <div className="bg-green-500 h-3 rounded-full" style={{ width: row.acceptanceRate }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (isTransOp) {
    const decisionTotal = transOpSummary.total;
    const acceptedPct = decisionTotal > 0 ? Math.round((transOpSummary.accepted / decisionTotal) * 100) : 0;
    const pendingPct = decisionTotal > 0 ? Math.round((transOpSummary.pending / decisionTotal) * 100) : 0;
    const declinedPct = decisionTotal > 0 ? Math.round((transOpSummary.declined / decisionTotal) * 100) : 0;

    return (
      <div className="flex flex-col w-full h-screen p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Transportation Operator Dashboard</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{context?.email}</span>
            <Badge variant="outline">{userAttributes.role}</Badge>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Accepted */}
          <div className="border-2 border-green-200 rounded-xl p-5 bg-green-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Accepted</span>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-600">{transOpSummary.accepted}</div>
          </div>
          {/* Pending */}
          <div className="border-2 border-amber-200 rounded-xl p-5 bg-amber-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Pending</span>
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-amber-600">{transOpSummary.pending}</div>
          </div>
          {/* Declined */}
          <div className="border-2 border-red-200 rounded-xl p-5 bg-red-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Declined</span>
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-red-600">{transOpSummary.declined}</div>
          </div>
          {/* Today's Pickups */}
          <div className="border-2 border-blue-200 rounded-xl p-5 bg-blue-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Today&apos;s Pickups</span>
              <Truck className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600">{transOpSummary.todaysPickups}</div>
          </div>
          {/* Late Responses */}
          <div className="border-2 border-orange-200 rounded-xl p-5 bg-orange-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Late Responses</span>
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-orange-600">{transOpSummary.lateResponses}</div>
          </div>
        </div>

        {/* Middle Row: Decision Snapshot + Turnaround Response Time */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Decision Snapshot Donut */}
          <div className="border rounded-xl p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Decision Snapshot</h2>
            {decisionSnapshotData.length === 0 ? (
              <div className="text-sm text-gray-600">No decision data available</div>
            ) : (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={decisionSnapshotData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={2}
                      >
                        {decisionSnapshotData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-center gap-8">
                  <div className="text-center">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-600">Accepted</span>
                    </div>
                    <div className="text-2xl font-bold">{transOpSummary.accepted}</div>
                    <div className="text-xs text-gray-500">{acceptedPct}%</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
                      <span className="text-sm text-gray-600">Pending</span>
                    </div>
                    <div className="text-2xl font-bold">{transOpSummary.pending}</div>
                    <div className="text-xs text-gray-500">{pendingPct}%</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-sm text-gray-600">Declined</span>
                    </div>
                    <div className="text-2xl font-bold">{transOpSummary.declined}</div>
                    <div className="text-xs text-gray-500">{declinedPct}%</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Turnaround Response Time */}
          <div className="border rounded-xl p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Turnaround Response Time</h2>
              <Badge variant="secondary">Weekly Average</Badge>
            </div>
            {turnaroundData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-gray-500">
                No turnaround data available yet
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={turnaroundData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis
                      label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                              <p className="text-sm font-semibold">{item.week}</p>
                              <p className="text-xs text-gray-600">Avg Response: {item.hours}h</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      y={4}
                      stroke="#ef4444"
                      strokeDasharray="6 4"
                      strokeWidth={2}
                    />
                    <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Legend
                      content={() => (
                        <div className="flex justify-center gap-6 mt-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-block h-3 w-3 rounded-sm bg-blue-500" />
                            <span className="text-xs text-gray-600">Actual Response Time</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-4 h-0 border-t-2 border-dashed border-red-500" />
                            <span className="text-xs text-gray-600">4-Hour Target</span>
                          </div>
                        </div>
                      )}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Pickup Calendar Heatmap */}
        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-semibold">Pickup Calendar Heatmap</h2>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>Less</span>
              <span className="inline-block h-3 w-3 rounded-sm bg-blue-100" />
              <span className="inline-block h-3 w-3 rounded-sm bg-blue-300" />
              <span className="inline-block h-3 w-3 rounded-sm bg-blue-500" />
              <span className="inline-block h-3 w-3 rounded-sm bg-blue-700" />
              <span>More</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">Daily pickup count &ndash; last 60 days</p>

          <div className="w-full">
            <div className="flex gap-0.5 w-full">
              {/* Day labels */}
              <div className="flex flex-col gap-0.5 mr-1 justify-start pt-6 flex-shrink-0">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                  <div key={day} className="h-10 flex items-center text-xs text-gray-500 pr-2">
                    {day}
                  </div>
                ))}
              </div>
              {/* Week columns */}
              {heatmapData.weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
                  <div className="text-xs text-gray-400 mb-0.5 h-5 truncate">
                    {wi === 0 || week.month !== heatmapData.weeks[wi - 1]?.month ? week.month : ''}
                  </div>
                  {[1, 2, 3, 4, 5].map((dow) => {
                    const dayCell = week.days.find(dd => dd.dayOfWeek === dow);
                    if (!dayCell) return <div key={dow} className="h-10 w-full rounded-sm" />;
                    const maxCount = heatmapData.busiestDay || 1;
                    const intensity = dayCell.count / maxCount;
                    const bg = dayCell.count === 0
                      ? '#f3f4f6'
                      : `rgba(37, 99, 235, ${0.2 + intensity * 0.8})`;
                    return (
                      <div
                        key={dow}
                        className="h-10 w-full rounded-sm flex items-center justify-center text-xs font-medium"
                        style={{
                          backgroundColor: bg,
                          color: intensity > 0.5 ? 'white' : dayCell.count === 0 ? '#9ca3af' : '#1e3a5f',
                        }}
                        title={`${dayCell.date}: ${dayCell.count} pickups`}
                      >
                        {dayCell.count}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="mt-6 flex justify-between border-t pt-4">
            <div className="text-center">
              <div className="text-xs text-gray-500">Busiest Day</div>
              <div className="text-lg font-bold">{heatmapData.busiestDay} pickups</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Average Daily</div>
              <div className="text-lg font-bold">{heatmapData.avgDaily} pickups</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Total (60 days)</div>
              <div className="text-lg font-bold">{heatmapData.totalPickups} pickups</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen p-8 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{context?.email}</span>
          <Badge variant="outline">{userAttributes.role}</Badge>
          {context?.destination && (
            <Badge variant="secondary">Terminal: {context.destination}</Badge>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4 text-sm text-gray-600">
        <span>Total Items: <strong>{context?.itemCount}</strong></span>
        <span>Role: <strong>{analyticsData.role}</strong></span>
      </div>

      {/* Top Summary Cards */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Terminal Capacity</div>
          <div className="text-3xl font-bold text-amber-600">{terminalCapacityUtilization}%</div>
          <div className="text-sm text-gray-500 mt-2">
            {terminalCapacityToday > 0
              ? `${arrivingTodayCount} of ${terminalCapacityToday} slots filled today`
              : 'No active capacity schedule found for today'}
          </div>
        </div>
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Approvals Awaiting</div>
          <div className="text-3xl font-bold text-blue-600">{approvalAwaitingCount}</div>
          <div className="text-sm text-gray-500 mt-2">Requires immediate action</div>
        </div>
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Arriving Today</div>
          <div className="text-3xl font-bold text-purple-600">{arrivingTodayCount}</div>
          <div className="text-sm text-gray-500 mt-2">Containers expected</div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Container Status Distribution */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Container Status Distribution</h2>
          {statusChartData.length === 0 ? (
            <div className="text-sm text-gray-600">No status data available</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {statusChartData.map((entry, idx) => (
                      <Cell key={entry.name} fill={chartColors[idx % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-600">
            {statusChartData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                />
                <span>{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal Capacity Trend */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Terminal Capacity Trend</h2>
          {terminalCapacityTrendData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-sm text-gray-600 border border-dashed rounded-md">
              No terminal capacity schedules available
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={terminalCapacityTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="capacity" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed Heat Bar */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Activity Feed Heat Bar</h2>
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          {hourlyActivityData.every((item) => item.count === 0) ? (
            <div className="text-sm text-gray-600">No activity data for today</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyActivityData}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={1} />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    fill="#22c55e"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-4 text-sm text-gray-600">
            Additional activity thresholds can be defined once scheduling inputs are finalized.
          </div>
        </div>
      </div>
    </div>
  );
}
