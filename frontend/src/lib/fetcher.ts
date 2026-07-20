import { apiFetch, safeJson } from './api';

/**
 * A generic SWR fetcher that uses our custom apiFetch wrapper.
 * This ensures that credentials, CSRF tokens, and 401 redirects
 * are automatically handled for all SWR hooks.
 */
export const swrFetcher = async (url: string) => {
  const res = await apiFetch(url);
  if (!res.ok) {
    const error: any = new Error('An error occurred while fetching the data.');
    try {
      error.info = await safeJson(res);
    } catch {
      error.info = { detail: res.statusText };
    }
    error.status = res.status;
    throw error;
  }
  return safeJson(res);
};
