export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('access_token');
  
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Basic unauthorized handling - in a real app you might want to try refreshing the token here
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  }

  return response;
}
