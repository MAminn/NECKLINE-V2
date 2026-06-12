import { getCsrfToken, invalidateCsrfToken, isSafeMethod } from './csrf';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface ApiOptions extends RequestInit {
  idempotencyKey?: string;
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const csrfToken = await getCsrfToken();
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function parseResponseBody(response: Response, path: string) {
  const hasBody =
    response.status !== 204 && response.headers.get('content-length') !== '0';
  if (!hasBody) return null;

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (parseError) {
    if (response.ok) {
      // A 2xx with a malformed body is a contract bug — surface it
      const error = new Error(
        `Invalid JSON in response from ${path} (HTTP ${response.status}): ${text.slice(0, 200)}`
      );
      (error as any).status = response.status;
      (error as any).code = 'INVALID_JSON';
      (error as any).data = text;
      (error as any).cause = parseError;
      throw error;
    }
    // Error responses may have non-JSON bodies (e.g. proxy HTML);
    // the caller throws the HTTP error with data = null
    return null;
  }
}

async function apiClient(path: string, options: ApiOptions = {}) {
  const url = `${API_BASE}${path}`;
  const correlationId = generateCorrelationId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-correlation-id': correlationId,
    ...(options.headers as Record<string, string>),
  };

  if (options.idempotencyKey) {
    headers['idempotency-key'] = options.idempotencyKey;
  }

  if (!isSafeMethod(options.method)) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) headers['x-csrf-token'] = csrfToken;
  }

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Auto-refresh on 401 if not a refresh request itself
  if (response.status === 401 && path !== '/auth/refresh') {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  // Stale/missing CSRF token (e.g. cookie expired): fetch a fresh one and retry once
  if (response.status === 403 && !isSafeMethod(options.method)) {
    invalidateCsrfToken();
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  const data = await parseResponseBody(response, path);

  if (!response.ok) {
    const error = new Error(data?.message || `HTTP ${response.status}`);
    (error as any).status = response.status;
    (error as any).code = data?.code;
    (error as any).data = data;
    throw error;
  }

  return data;
}

export { apiClient, generateCorrelationId };
