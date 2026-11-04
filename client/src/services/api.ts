const BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

export class ApiError extends Error {
  public status: number;
  public details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const token = localStorage.getItem('voxora_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // If 401 and we have a stale token, notify or clean up if needed
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      // Clear token if unauthorized
      window.dispatchEvent(new CustomEvent('voxora:unauthorized'));
    }

    const errorMsg = (data && data.error) || response.statusText || 'Request failed';
    throw new ApiError(errorMsg, response.status, data);
  }

  return data;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: 'DELETE', body: body !== undefined ? JSON.stringify(body) : undefined }),
};
