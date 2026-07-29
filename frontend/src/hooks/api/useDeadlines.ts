import useSWR from 'swr';
import { API_BASE } from '@/lib/api';
import { swrFetcher } from '@/lib/fetcher';

interface UseDeadlinesOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  deadline_type?: string;
  enabled?: boolean;
}

export function useDeadlines(options: UseDeadlinesOptions = {}) {
  const {
    page = 1,
    limit = 20,
    search = '',
    status = '',
    priority = '',
    deadline_type = '',
    enabled = true,
  } = options;

  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) query.append('search', search);
  if (status) query.append('status', status);
  if (priority) query.append('priority', priority);
  if (deadline_type) query.append('deadline_type', deadline_type);

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

export function useDeadlinesSummary(options: { search?: string; enabled?: boolean } = {}) {
  const { search = '', enabled = true } = options;
  const query = new URLSearchParams();
  if (search) query.append('search', search);

  const url = enabled ? `${API_BASE}/deadlines/summary/?${query.toString()}` : null;
  const { data, error, isLoading, mutate } = useSWR(url, swrFetcher, {
    revalidateOnFocus: false,
  });

  return {
    summary: data || { today: 0, week: 0, overdue: 0, completed: 0 },
    isLoading,
    isError: error,
    mutate,
  };
}
