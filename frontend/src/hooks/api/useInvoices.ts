import useSWR from 'swr';
import { API_BASE } from '@/lib/api';
import { swrFetcher } from '@/lib/fetcher';

interface UseInvoicesOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  enabled?: boolean;
}

export function useInvoices(options: UseInvoicesOptions = {}) {
  const {
    page = 1,
    limit = 20,
    search = '',
    status = '',
    enabled = true,
  } = options;

  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) query.append('search', search);
  if (status) query.append('status', status);

  const url = enabled ? `${API_BASE}/invoices/?${query.toString()}` : null;

  const { data, error, isLoading, mutate } = useSWR(url, swrFetcher, {
    revalidateOnFocus: false,
  });

  const invoices = data?.results || (Array.isArray(data) ? data : []);
  const count = data?.count ?? invoices.length;
  const totalPages = Math.ceil(count / limit);

  return {
    invoices,
    count,
    totalPages,
    isLoading,
    isError: error,
    mutate,
  };
}
