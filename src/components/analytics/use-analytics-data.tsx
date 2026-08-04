import { useEffect, useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { AnalyticsResponse, TerminalCapacityRecord } from './analytics-types';
import { unwrapDynamoValue, parseDateInput } from './analytics-utils';

const API_ENDPOINT = 'https://44ymq6eqfa.execute-api.us-east-1.amazonaws.com/metrics';
const TERMINAL_CAPACITY_API_ENDPOINT = 'https://xlj2x9eurh.execute-api.us-east-1.amazonaws.com/dev/terminalCapacityList';

const ANALYTICS_ENABLED_ROLES = new Set([
  'Beneficiary Cargo Owner',
  'Terminal Operator',
  'Trucking Operator',
  'Rail Operator',
  'Third Party Logistics Provider',
]);

export function useAnalyticsData(role: string) {
  const { user } = useAuthenticator();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  const [terminalCapacityRecords, setTerminalCapacityRecords] = useState<TerminalCapacityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!user || !ANALYTICS_ENABLED_ROLES.has(role)) return;

      try {
        setLoading(true);
        setError(null);

        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();

        if (!idToken) {
          throw new Error('No authentication token available');
        }

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

        if (!data.ok) {
          throw new Error(data.message || 'Failed to fetch analytics');
        }

        setAnalyticsData(data);

        const roleLower = (data.role || role || '').toLowerCase();
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
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [user, role]);

  return { analyticsData, terminalCapacityRecords, loading, error };
}
