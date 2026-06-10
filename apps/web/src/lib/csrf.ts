const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// The API sets the CSRF cookie on its own domain (cross-site from the web
// app), so we can't read it from document.cookie. Instead GET /csrf returns
// the token in the body; we cache it and echo it in the x-csrf-token header.
let cachedToken: string | null = null;
let inflight: Promise<string | null> | null = null;

async function fetchCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/csrf`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.csrfToken ?? null;
  } catch {
    return null;
  }
}

export async function getCsrfToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  if (!inflight) {
    const request = fetchCsrfToken().then((token) => {
      // Skip caching if invalidateCsrfToken() superseded this fetch.
      if (inflight === request) {
        cachedToken = token;
        inflight = null;
      }
      return token;
    });
    inflight = request;
  }
  return inflight;
}

export function invalidateCsrfToken(): void {
  cachedToken = null;
  inflight = null;
}

export function isSafeMethod(method?: string): boolean {
  return SAFE_METHODS.has((method || 'GET').toUpperCase());
}
