const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');
const TOKEN_KEY = 'clinicflow.token';
const REQUEST_TIMEOUT_MS = 15_000;

export interface ApiErrorDetail {
  location?: string;
  path: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

type Query = Record<string, string | number | undefined | null>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
}

export async function api<T>(path: string, { method = 'GET', body, query }: RequestOptions = {}): Promise<T> {
  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = tokenStorage.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted) throw new ApiError(0, 'TIMEOUT', 'The server took too long to respond.');
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection or that the API is running.');
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return undefined as T;
  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    const err = payload?.error ?? {};
    // Expired or invalid session: drop the token and go back to the login page
    if (res.status === 401 && token && path !== '/auth/login') {
      tokenStorage.clear();
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    throw new ApiError(res.status, err.code ?? 'UNKNOWN_ERROR', err.message ?? `Request failed (${res.status})`, err.details);
  }
  return payload as T;
}
