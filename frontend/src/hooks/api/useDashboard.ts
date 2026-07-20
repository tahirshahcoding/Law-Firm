import useSWR from 'swr';
import { API_BASE } from '@/lib/api';
import { swrFetcher } from '@/lib/fetcher';

interface UseDashboardOptions {
  enabled?: boolean;
}

export function useDashboard(options: UseDashboardOptions = {}) {
  const { enabled = true } = options;

  const url = enabled ? `${API_BASE}/dashboard/stats/` : null;

  const { data, error, isLoading, mutate } = useSWR(url, swrFetcher, {
    revalidateOnFocus: true, // Dashboard should stay fresh
  });

  return {
    stats: data,
    isLoading,
    isError: error,
    mutate,
  };
}
