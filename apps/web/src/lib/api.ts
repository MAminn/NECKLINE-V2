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
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
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

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export { apiClient, generateCorrelationId };
