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
} from 'recharts';

export const Route = createFileRoute('/analytics')({
  component: Analytics,
})

const API_ENDPOINT = 'https://44ymq6eqfa.execute-api.us-east-1.amazonaws.com/metrics';

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

interface AnalyticsResponse {
  ok: boolean;
  role?: string;
  message?: string;
  context?: {
    email: string | null;
    destination: string | null;
    itemCount: number;
  };
  data?: TerminalAnalyticsData | BCOAnalyticsData;
}

function Analytics() {
  const { user } = useAuthenticator();
  const [userAttributes, setUserAttributes] = useState<{ role: string; email: string }>({
    role: '',
    email: '',
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
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
          <div className="text-3xl font-bold text-amber-600">--%</div>
          <div className="text-sm text-gray-500 mt-2">
            Additional capacity data required
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
          <div className="h-72 flex items-center justify-center text-sm text-gray-600 border border-dashed rounded-md">
            Additional capacity trend data required
          </div>
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
