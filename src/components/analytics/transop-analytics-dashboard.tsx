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
import { Badge } from '../ui/badge';
import type { DashboardVariant, TransOpAnalyticsData } from './analytics-types';

interface TransOpAnalyticsDashboardProps {
  data?: TransOpAnalyticsData;
  variant?: DashboardVariant;
}

export function TransOpAnalyticsDashboard({ data, variant = 'full' }: TransOpAnalyticsDashboardProps) {
  const isCompact = variant === 'compact';
  const now = new Date();

  const transOpSummary = React.useMemo(() => {
    if (!data?.decisionSummary) {
      return { accepted: 0, pending: 0, declined: 0, todaysPickups: 0, lateResponses: 0, total: 0 };
    }

    const decisions = data.decisionSummary ?? {};
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
    const todaysPickups = (data.calendarEvents || []).filter(
      (ev) => new Date(ev.when).toDateString() === todayStr
    ).length;

    const lateResponses = (data.calendarEvents || []).filter((ev) => {
      const st = (ev.reservationStatus || '').toLowerCase();
      return st.includes('late') || ev.hoursUntil < 0;
    }).length;

    const total = accepted + pending + declined;
    return { accepted, pending, declined, todaysPickups, lateResponses, total };
  }, [data, now]);

  const decisionSnapshotData = React.useMemo(() => {
    return [
      { name: 'Accepted', value: transOpSummary.accepted, color: '#22c55e' },
      { name: 'Pending', value: transOpSummary.pending, color: '#f59e0b' },
      { name: 'Declined', value: transOpSummary.declined, color: '#ef4444' },
    ].filter((item) => item.value > 0);
  }, [transOpSummary]);

  const turnaroundData = React.useMemo(() => {
    const events = data?.calendarEvents || [];

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

    events.forEach((ev) => {
      const dt = new Date(ev.when);
      if (Number.isNaN(dt.getTime())) return;
      const matchWeek = weekData.find((w) => dt >= w.start && dt <= w.end);
      if (matchWeek) {
        matchWeek.totalHours += Math.abs(ev.hoursUntil);
        matchWeek.count += 1;
      }
    });

    return weekData.map((w) => ({
      week: w.week,
      hours: w.count > 0 ? +(w.totalHours / w.count).toFixed(1) : 0,
    }));
  }, [data, now]);

  const heatmapData = React.useMemo(() => {
    const events = data?.calendarEvents || [];

    const dateCounts: { [dateStr: string]: number } = {};
    events.forEach((ev) => {
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

    const allCounts = weeks.flatMap((w) => w.days.map((dayItem) => dayItem.count));
    const totalPickups = allCounts.reduce((s, c) => s + c, 0);
    const busiestDay = Math.max(...allCounts, 0);
    const avgDaily = +(totalPickups / 60).toFixed(1);

    return { weeks, totalPickups, busiestDay, avgDaily };
  }, [data, now]);

  if (!data) return null;

  const decisionTotal = transOpSummary.total;
  const acceptedPct = decisionTotal > 0 ? Math.round((transOpSummary.accepted / decisionTotal) * 100) : 0;
  const pendingPct = decisionTotal > 0 ? Math.round((transOpSummary.pending / decisionTotal) * 100) : 0;
  const declinedPct = decisionTotal > 0 ? Math.round((transOpSummary.declined / decisionTotal) * 100) : 0;

  const cardPad = isCompact ? 'p-4' : 'p-5';
  const cardValue = isCompact ? 'text-2xl' : 'text-3xl';

  return (
    <div className={isCompact ? 'mb-8' : ''}>
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className={`border-2 border-green-200 rounded-xl ${cardPad} bg-green-50/50`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Accepted</span>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <div className={`${cardValue} font-bold text-green-600`}>{transOpSummary.accepted}</div>
        </div>
        <div className={`border-2 border-amber-200 rounded-xl ${cardPad} bg-amber-50/50`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Pending</span>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div className={`${cardValue} font-bold text-amber-600`}>{transOpSummary.pending}</div>
        </div>
        <div className={`border-2 border-red-200 rounded-xl ${cardPad} bg-red-50/50`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Declined</span>
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className={`${cardValue} font-bold text-red-600`}>{transOpSummary.declined}</div>
        </div>
        <div className={`border-2 border-blue-200 rounded-xl ${cardPad} bg-blue-50/50`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Today&apos;s Pickups</span>
            <Truck className="h-5 w-5 text-blue-500" />
          </div>
          <div className={`${cardValue} font-bold text-blue-600`}>{transOpSummary.todaysPickups}</div>
        </div>
        <div className={`border-2 border-orange-200 rounded-xl ${cardPad} bg-orange-50/50`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Late Responses</span>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <div className={`${cardValue} font-bold text-orange-600`}>{transOpSummary.lateResponses}</div>
        </div>
      </div>

      <div className={isCompact ? 'grid grid-cols-1 gap-4' : 'mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6'}>
        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Decision Snapshot</h2>
          {decisionSnapshotData.length === 0 ? (
            <div className="text-sm text-gray-600">No decision data available</div>
          ) : (
            <>
              <div className={isCompact ? 'h-56' : 'h-64'}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={decisionSnapshotData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={isCompact ? 50 : 60}
                      outerRadius={isCompact ? 80 : 95}
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

        {!isCompact && (
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
                    <ReferenceLine y={4} stroke="#ef4444" strokeDasharray="6 4" strokeWidth={2} />
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
        )}
      </div>

      {!isCompact && (
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
              <div className="flex flex-col gap-0.5 mr-1 justify-start pt-6 flex-shrink-0">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                  <div key={day} className="h-10 flex items-center text-xs text-gray-500 pr-2">
                    {day}
                  </div>
                ))}
              </div>
              {heatmapData.weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
                  <div className="text-xs text-gray-400 mb-0.5 h-5 truncate">
                    {wi === 0 || week.month !== heatmapData.weeks[wi - 1]?.month ? week.month : ''}
                  </div>
                  {[1, 2, 3, 4, 5].map((dow) => {
                    const dayCell = week.days.find((dd) => dd.dayOfWeek === dow);
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
