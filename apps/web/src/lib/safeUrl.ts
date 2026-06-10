// Guards against open-redirect / tainted-URL navigation.
// Untrusted values (query params, API payloads) must pass through one of
// these before being handed to router.push or window.location.

/**
 * Returns the path if it is a safe internal path (single leading slash),
 * otherwise the fallback. Rejects absolute URLs, protocol-relative URLs
 * ("//evil.com"), and backslash variants ("/\evil.com").
 */
export function safeInternalPath(path: string | null | undefined, fallback = '/'): string {
  if (!path) return fallback;
  if (!path.startsWith('/')) return fallback;
  if (path.startsWith('//') || path.startsWith('/\\')) return fallback;
  return path;
}

/** Hosts we allow as external payment-redirect targets. */
const ALLOWED_PAYMENT_HOSTS = ['accept.paymob.com', 'accept.paymobsolutions.com'];

/**
 * Returns the URL if it is an https URL pointing at an allowed payment host,
 * otherwise null.
 */
export function safePaymentUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  if (!ALLOWED_PAYMENT_HOSTS.includes(parsed.hostname)) return null;
  return parsed.href;
}
