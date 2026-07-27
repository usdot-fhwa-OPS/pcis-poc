import * as React from 'react';
import { Link } from '@tanstack/react-router';
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
} from 'recharts';
import type { DashboardVariant, TerminalAnalyticsData, TerminalCapacityRecord, UpcomingEvent } from './analytics-types';
import { ANALYTICS_CHART_COLORS, appliesOnDate, startOfDay } from './analytics-utils';

interface TerminalAnalyticsDashboardProps {
  data?: TerminalAnalyticsData;
  terminalCapacityRecords: TerminalCapacityRecord[];
  variant?: DashboardVariant;
}

export function TerminalAnalyticsDashboard({ data, terminalCapacityRecords, variant = 'full' }: TerminalAnalyticsDashboardProps) {
  const isCompact = variant === 'compact';
  const now = new Date();

  const statusChartData = React.useMemo(() => {
    if (!data?.statusDistribution) return [];
    return Object.entries(data.statusDistribution).map(([status, count]) => ({ name: status, value: count }));
  }, [data]);

  const approvalAwaitingCount = React.useMemo(() => {
    if (!data?.approvalQueueSummary) return 0;
    return Object.entries(data.approvalQueueSummary).reduce((sum, [status, count]) => {
      if (status.toLowerCase().includes('pending') || status.toLowerCase().includes('await')) {
        return sum + (count as number);
      }
      return sum;
    }, 0);
  }, [data]);

  const arrivingTodayCount = React.useMemo(() => {
    if (!data?.eventsToday) return 0;
    const todayKey = now.toDateString();
    return data.eventsToday.filter((event: UpcomingEvent) => new Date(event.when).toDateString() === todayKey).length;
  }, [data, now]);

  const terminalCapacityTrendData = React.useMemo(() => {
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

  const hourlyActivityData = React.useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
      count: 0,
    }));

    if (!data?.eventsToday) return hours;

    data.eventsToday.forEach((event: UpcomingEvent) => {
      const dt = new Date(event.when);
      if (Number.isNaN(dt.getTime())) return;
      if (dt.toDateString() !== now.toDateString()) return;
      const hour = dt.getHours();
      hours[hour].count += 1;
    });

    return hours;
  }, [data, now]);

  if (!data) return null;

  const cardPad = isCompact ? 'p-4' : 'p-6';
  const cardLabel = isCompact ? 'text-xs' : 'text-sm';
  const cardValue = isCompact ? 'text-2xl' : 'text-3xl';

  return (
    <div className={isCompact ? 'mb-8' : ''}>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`border rounded-lg ${cardPad} bg-white shadow-sm`}>
          <div className={`${cardLabel} text-gray-600 mb-1`}>Terminal Capacity</div>
          <div className={`${cardValue} font-bold text-amber-600`}>{terminalCapacityUtilization}%</div>
          <div className="text-xs text-gray-500 mt-1">
            {terminalCapacityToday > 0
              ? `${arrivingTodayCount} of ${terminalCapacityToday} slots filled today`
              : 'No active capacity schedule found for today'}
          </div>
        </div>
        <div className={`border rounded-lg ${cardPad} bg-white shadow-sm`}>
          <div className={`${cardLabel} text-gray-600 mb-1`}>Approvals Awaiting</div>
          <div className={`${cardValue} font-bold text-blue-600`}>{approvalAwaitingCount}</div>
          <div className="text-xs text-gray-500 mt-1">Requires immediate action</div>
        </div>
        <div className={`border rounded-lg ${cardPad} bg-white shadow-sm`}>
          <div className={`${cardLabel} text-gray-600 mb-1`}>Arriving Today</div>
          <div className={`${cardValue} font-bold text-purple-600`}>{arrivingTodayCount}</div>
          <div className="text-xs text-gray-500 mt-1">Containers expected</div>
        </div>
      </div>

      <div className={isCompact ? 'grid grid-cols-1 gap-4' : 'mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4'}>
        <div className={`border rounded-lg ${cardPad} bg-white shadow-sm`}>
          <h3 className="text-lg font-semibold mb-3">Container Status Distribution</h3>
          {statusChartData.length === 0 ? (
            <div className="text-sm text-gray-600">No status data available</div>
          ) : (
            <div className={isCompact ? 'h-56' : 'h-72'}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={isCompact ? 70 : 90}
                    label
                  >
                    {statusChartData.map((entry, idx) => (
                      <Cell key={entry.name} fill={ANALYTICS_CHART_COLORS[idx % ANALYTICS_CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
            {statusChartData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ANALYTICS_CHART_COLORS[idx % ANALYTICS_CHART_COLORS.length] }}
                />
                <span className="truncate">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {!isCompact && (
          <div className={`border rounded-lg ${cardPad} bg-white shadow-sm`}>
            <h3 className="text-lg font-semibold mb-3">Terminal Capacity Trend</h3>
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
        )}
      </div>

      {!isCompact && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Activity Feed Heat Bar</h3>
          <div className={`border rounded-lg ${cardPad} bg-white shadow-sm`}>
            {hourlyActivityData.every((item) => item.count === 0) ? (
              <div className="text-sm text-gray-600">No activity data for today</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyActivityData}>
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={1} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {isCompact && (
        <div className="flex justify-end mt-2">
          <Link to="/analytics" className="text-sm text-blue-600 hover:underline">
            View full analytics &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
