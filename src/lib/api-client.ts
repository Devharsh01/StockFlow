export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error(data.error || 'API Request failed');
  }

  return data.data;
}

export async function searchCustomers(query: string) {
  const data = await apiFetch(`/api/sales/customers/search?q=${encodeURIComponent(query)}`);
  return data || [];
}
