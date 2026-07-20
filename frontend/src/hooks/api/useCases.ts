import useSWR from 'swr';
import { API_BASE } from '@/lib/api';
import { swrFetcher } from '@/lib/fetcher';

interface UseCasesOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  priority?: string;
  status?: string;
  enabled?: boolean;
}

export function useCases(options: UseCasesOptions = {}) {
  const {
    page = 1,
    limit = 20,
    search = '',
    category = '',
    priority = '',
    status = '',
    enabled = true,
  } = options;

  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) query.append('search', search);
  if (category) query.append('category', category);
  if (priority) query.append('priority', priority);
  if (status) query.append('status', status);

  const url = enabled ? `${API_BASE}/cases/?${query.toString()}` : null;

  const { data, error, isLoading, mutate } = useSWR(url, swrFetcher, {
    revalidateOnFocus: false, // Don't spam API when switching tabs
  });

  // Handle both paginated DRF response format and raw array format
  const cases = data?.results || (Array.isArray(data) ? data : []);
  const count = data?.count ?? cases.length;
  const totalPages = Math.ceil(count / limit);

  return {
    cases,
    count,
    totalPages,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCaseDetails(id: string | null) {
  const url = id ? `${API_BASE}/cases/${id}/` : null;
  const { data, error, isLoading, mutate } = useSWR(url, swrFetcher);

  return {
    caseDetails: data,
    isLoading,
    isError: error,
    mutate,
  };
}
