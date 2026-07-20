import useSWR from 'swr';
import { API_BASE } from '@/lib/api';
import { swrFetcher } from '@/lib/fetcher';

interface UseDeadlinesOptions {
  page?: number;
  limit?: number;
  search?: string;
  enabled?: boolean;
}

export function useDeadlines(options: UseDeadlinesOptions = {}) {
  const {
    page = 1,
    limit = 20,
    search = '',
    enabled = true,
  } = options;

  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) query.append('search', search);

  const url = enabled ? `${API_BASE}/deadlines/?${query.toString()}` : null;

  const { data, error, isLoading, mutate } = useSWR(url, swrFetcher, {
    revalidateOnFocus: false,
  });

  const deadlines = data?.results || (Array.isArray(data) ? data : []);
  const count = data?.count ?? deadlines.length;
  const totalPages = Math.ceil(count / limit);

  return {
    deadlines,
    count,
    totalPages,
    isLoading,
    isError: error,
    mutate,
  };
}
