import { createFileRoute } from '@tanstack/react-router'
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { useEffect, useMemo, useState } from 'react';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { useAnalyticsData } from '../components/analytics/use-analytics-data';
import { BcoAnalyticsDashboard } from '../components/analytics/bco-analytics-dashboard';
import { TerminalAnalyticsDashboard } from '../components/analytics/terminal-analytics-dashboard';
import { TransOpAnalyticsDashboard } from '../components/analytics/transop-analytics-dashboard';
import type { BCOAnalyticsData, TerminalAnalyticsData, TransOpAnalyticsData } from '../components/analytics/analytics-types';

export const Route = createFileRoute('/analytics')({
  component: Analytics,
})

function Analytics() {
  const { user } = useAuthenticator();
  const [userAttributes, setUserAttributes] = useState<{ role: string; email: string }>({
    role: '',
    email: '',
  });

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

  const { analyticsData, terminalCapacityRecords, loading, error } = useAnalyticsData(userAttributes.role);

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

  const context = analyticsData?.context;

  if (loading) {
    return (
      <div className="flex flex-col w-full h-screen p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Analytics</h1>
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
        </div>

        <BcoAnalyticsDashboard data={analyticsData.data as BCOAnalyticsData} variant="full" />
      </div>
    );
  }

  if (isTransOp) {
    return (
      <div className="flex flex-col w-full h-screen p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Transportation Operator Dashboard</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{context?.email}</span>
            <Badge variant="outline">{userAttributes.role}</Badge>
          </div>
        </div>

        <TransOpAnalyticsDashboard data={analyticsData.data as TransOpAnalyticsData} variant="full" />
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
      </div>

      <TerminalAnalyticsDashboard
        data={analyticsData.data as TerminalAnalyticsData}
        terminalCapacityRecords={terminalCapacityRecords}
        variant="full"
      />
    </div>
  );
}
