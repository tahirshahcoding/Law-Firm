import useSWR from 'swr';
import { API_BASE } from '@/lib/api';
import { swrFetcher } from '@/lib/fetcher';

interface UseDashboardOptions {
  enabled?: boolean;
  initialStats?: any;
}

export function useDashboard(options: UseDashboardOptions = {}) {
  const { enabled = true, initialStats } = options;

  const url = enabled ? `${API_BASE}/dashboard/stats/` : null;

  const { data, error, isLoading, mutate } = useSWR(url, swrFetcher, {
    fallbackData: initialStats,
    revalidateOnMount: !initialStats, // Skip initial client fetch if server component already provided stats
    revalidateOnFocus: true, // Dashboard should stay fresh when window gets focus
  });

  return {
    stats: data || initialStats,
    isLoading: isLoading && !initialStats,
    isError: error,
    mutate,
  };
}
