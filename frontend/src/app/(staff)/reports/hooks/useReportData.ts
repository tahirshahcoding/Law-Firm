import { useState, useCallback } from 'react';
import { apiFetch, API_BASE, safeJson, parseApiError } from '@/lib/api';

export function useReportData(endpoint: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (filters: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
      const response = await apiFetch(`${API_BASE}/reports/${endpoint}/?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report data.');
      }
      const jsonData = await safeJson(response);
      setData(jsonData);
    } catch (err: any) {
      setError(err.message || parseApiError(err) || 'Failed to fetch report data. You may not have permission.');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  return { data, loading, error, fetchReport };
}
