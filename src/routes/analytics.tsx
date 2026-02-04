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

interface AnalyticsResponse {
  ok: boolean;
  role?: string;
  message?: string;
  context?: {
    email: string | null;
    destination: string | null;
    itemCount: number;
  };
  data?: TerminalAnalyticsData;
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
    if (!data?.statusDistribution) return [];
    return Object.entries(data.statusDistribution).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  }, [data?.statusDistribution]);

  const approvalAwaitingCount = useMemo(() => {
    if (!data?.approvalQueueSummary) return 0;
    return Object.entries(data.approvalQueueSummary).reduce((sum, [status, count]) => {
      if (status.toLowerCase().includes('pending') || status.toLowerCase().includes('await')) {
        return sum + count;
      }
      return sum;
    }, 0);
  }, [data?.approvalQueueSummary]);

  const arrivingTodayCount = useMemo(() => {
    if (!data?.eventsToday) return 0;
    const todayKey = now.toDateString();
    return data.eventsToday.filter((event) => new Date(event.when).toDateString() === todayKey).length;
  }, [data?.eventsToday, now]);

  const hourlyActivityData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
      count: 0,
    }));

    if (!data?.eventsToday) return hours;

    data.eventsToday.forEach((event) => {
      const dt = new Date(event.when);
      if (Number.isNaN(dt.getTime())) return;
      if (dt.toDateString() !== now.toDateString()) return;
      const hour = dt.getHours();
      hours[hour].count += 1;
    });

    return hours;
  }, [data?.eventsToday, now]);

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
