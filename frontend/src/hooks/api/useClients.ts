import useSWR from 'swr';
import { API_BASE } from '@/lib/api';
import { swrFetcher } from '@/lib/fetcher';

interface UseClientsOptions {
  page?: number;
  limit?: number;
  search?: string;
  enabled?: boolean;
}

export function useClients(options: UseClientsOptions = {}) {
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

  const url = enabled ? `${API_BASE}/clients/?${query.toString()}` : null;

  const { data, error, isLoading, mutate } = useSWR(url, swrFetcher, {
    revalidateOnFocus: false,
  });

  const clients = data?.results || (Array.isArray(data) ? data : []);
  const count = data?.count ?? clients.length;
  const totalPages = Math.ceil(count / limit);

  return {
    clients,
    count,
    totalPages,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useClientDetails(id: string | null) {
  const url = id ? `${API_BASE}/clients/${id}/` : null;
  const { data, error, isLoading, mutate } = useSWR(url, swrFetcher);

  return {
    clientDetails: data,
    isLoading,
    isError: error,
    mutate,
  };
}
