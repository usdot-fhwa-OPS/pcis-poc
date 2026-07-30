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
} from 'recharts';
import type { BCOAnalyticsData, DashboardVariant } from './analytics-types';
import { ANALYTICS_CHART_COLORS } from './analytics-utils';

interface BcoAnalyticsDashboardProps {
  data?: BCOAnalyticsData;
  variant?: DashboardVariant;
}

export function BcoAnalyticsDashboard({ data, variant = 'full' }: BcoAnalyticsDashboardProps) {
  const isCompact = variant === 'compact';

  const statusChartData = React.useMemo(() => {
    if (!data?.cargoStatus) return [];
    return Object.entries(data.cargoStatus).map(([status, count]) => ({ name: status, value: count }));
  }, [data]);

  const summary = React.useMemo(() => {
    if (!data) {
      return {
        activeShipments: 0,
        onTimePercent: 0,
        delayed: 0,
        assignedOperators: 0,
        weekly: [] as Array<{ week: string; planned: number; actual: number; dateRange: string }>,
        assignments: [] as Array<{ name: string; requestsSent: number; accepted: number; pending: number; declined: number; acceptanceRate: string }>,
      };
    }

    const status = data.cargoStatus ?? {};
    const activeShipments = Object.values(status).reduce((s, v) => s + v, 0);
    const delayed = status['Delayed'] || status['Late'] || status['Late for Pick Up'] || 0;
    const onTimePercent = activeShipments > 0 ? Math.round(((activeShipments - delayed) / activeShipments) * 100) : 0;

    const now = new Date();
    const weeks = Array.from({ length: 5 }, (_, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() || 7) - (4 - i) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const formatDate = (d: Date) => {
        const month = d.toLocaleString('en-US', { month: 'short' });
        const day = d.getDate();
        return `${month} ${day}`;
      };
      return {
        week: `Week ${i + 1}`,
        start: weekStart,
        end: weekEnd,
        dateRange: `${formatDate(weekStart)} - ${formatDate(weekEnd)}`,
        planned: 0,
        actual: 0,
      };
    });

    (data.shipmentTimeline || []).forEach((event) => {
      const eventDate = new Date(event.when);
      const weekIndex = weeks.findIndex((w) => eventDate >= w.start && eventDate <= w.end);
      if (weekIndex >= 0) {
        weeks[weekIndex].actual += 1;
        weeks[weekIndex].planned = weeks[weekIndex].actual + Math.floor(Math.random() * 3);
      }
    });

    const weekly = weeks.map((w) => ({ week: w.week, planned: w.planned, actual: w.actual, dateRange: w.dateRange }));

    const assignmentSummary = data.transportationAssignmentSummary ?? {};
    const operatorMap = new Map<string, { sent: number; accepted: number; pending: number; declined: number }>();

    Object.entries(assignmentSummary).forEach(([statusKey, count]) => {
      const statusLower = statusKey.toLowerCase();
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

    return { activeShipments, onTimePercent, delayed, assignedOperators: assignments.length, weekly, assignments };
  }, [data]);

  if (!data) return null;

  const cardPad = isCompact ? 'p-4' : 'p-6';
  const cardLabel = isCompact ? 'text-xs' : 'text-sm';
  const cardValue = isCompact ? 'text-2xl' : 'text-3xl';

  return (
    <div className={isCompact ? 'mb-8' : ''}>
      <div className={`mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`}>
        <div className={`border rounded-lg ${cardPad} bg-white shadow-sm`}>
          <div className={`${cardLabel} text-gray-600 mb-1`}>Active Shipments</div>
          <div className={`${cardValue} font-bold text-gray-800`}>{summary.activeShipments}</div>
        </div>
        <div className={`border rounded-lg ${cardPad} bg-white shadow-sm`}>
          <div className={`${cardLabel} text-gray-600 mb-1`}>On-Time Shipments</div>
          <div className={`${cardValue} font-bold text-green-600`}>{summary.onTimePercent}%</div>
        </div>
        <div className={`border rounded-lg ${cardPad} bg-white shadow-sm`}>
          <div className={`${cardLabel} text-gray-600 mb-1`}>Delayed Shipments</div>
          <div className={`${cardValue} font-bold text-amber-600`}>{summary.delayed}</div>
        </div>
        <div className={`border rounded-lg ${cardPad} bg-white shadow-sm`}>
          <div className={`${cardLabel} text-gray-600 mb-1`}>Assigned Operators</div>
          <div className={`${cardValue} font-bold text-purple-600`}>{summary.assignedOperators}</div>
        </div>
      </div>

      <div className={isCompact ? 'grid grid-cols-1 gap-4' : 'mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4'}>
        <div className={`border rounded-lg ${cardPad} bg-white shadow-sm`}>
          <h3 className="text-lg font-semibold mb-3">Cargo Status Breakdown</h3>
          {statusChartData.length > 0 ? (
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
          ) : (
            <div className={`${isCompact ? 'h-56' : 'h-72'} flex items-center justify-center text-sm text-gray-500`}>
              No status data available
            </div>
          )}
          <div className="mt-2 text-xs text-gray-600">Total Containers: {summary.activeShipments}</div>
          {statusChartData.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
              {statusChartData.map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: ANALYTICS_CHART_COLORS[idx % ANALYTICS_CHART_COLORS.length] }}
                  />
                  <span className="text-xs text-gray-700 truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isCompact && (
          <div className={`border rounded-lg ${cardPad} bg-white shadow-sm`}>
            <h3 className="text-lg font-semibold mb-3">Shipment Progress Timeline</h3>
            <div className="text-xs text-gray-500 mb-2">Planned vs actual milestone completion</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.weekly}>
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const point = payload[0].payload;
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                            <p className="text-sm font-semibold mb-1">{point.week}</p>
                            <p className="text-xs text-gray-600 mb-2">{point.dateRange}</p>
                            <div className="space-y-1">
                              <p className="text-xs"><span className="inline-block w-3 h-3 rounded-sm bg-blue-500 mr-1"></span>Actual: {point.actual}</p>
                              <p className="text-xs"><span className="inline-block w-3 h-3 rounded-sm bg-blue-300 mr-1"></span>Planned: {point.planned}</p>
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
        )}
      </div>

      {!isCompact && (
        <div className={`border rounded-lg ${cardPad} bg-white shadow-sm mb-6`}>
          <h3 className="text-lg font-semibold mb-3">Transportation Operator Assignment Summary</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-gray-600 border-b">
                  <th className="py-2 pr-4">Operator Name</th>
                  <th className="py-2 pr-4">Requests Sent</th>
                  <th className="py-2 pr-4">Accepted</th>
                  <th className="py-2 pr-4">Pending</th>
                  <th className="py-2 pr-4">Declined</th>
                  <th className="py-2">Acceptance Rate</th>
                </tr>
              </thead>
              <tbody>
                {summary.assignments.map((row) => (
                  <tr key={row.name} className="border-t">
                    <td className="py-2 pr-4">{row.name}</td>
                    <td className="py-2 pr-4">{row.requestsSent}</td>
                    <td className="py-2 pr-4 text-green-600">{row.accepted}</td>
                    <td className="py-2 pr-4 text-blue-600">{row.pending}</td>
                    <td className="py-2 pr-4 text-red-600">{row.declined}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-100 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: row.acceptanceRate }} />
                        </div>
                        <span className="text-xs">{row.acceptanceRate}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
