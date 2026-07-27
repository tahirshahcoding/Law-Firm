import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { API_BASE } from '@/lib/api';
import { swrFetcher } from '@/lib/fetcher';

export function useReportData(endpoint: string) {
  const [filters, setFilters] = useState<Record<string, any> | null>(null);

  const queryString = useMemo(() => {
    if (filters === null) return null;
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return params.toString();
  }, [filters]);

  // Only fetch when filters have been explicitly set via fetchReport()
  const url = queryString !== null ? `${API_BASE}/reports/${endpoint}/?${queryString}` : null;

  const { data, error, isLoading, mutate } = useSWR(url, swrFetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const fetchReport = (newFilters: Record<string, any>) => {
    setFilters(newFilters || {});
  };

  return {
    data,
    loading: isLoading,
    error: error ? (error.message || 'Failed to fetch report data. You may not have permission.') : null,
    fetchReport,
    mutate
  };
}
