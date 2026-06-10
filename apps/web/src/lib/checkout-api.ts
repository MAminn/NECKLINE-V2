import { getCsrfToken, invalidateCsrfToken, isSafeMethod } from './csrf';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface CheckoutContact {
  name: string;
  email: string;
  phone: string;
}

interface ShippingAddress {
  street: string;
  city: string;
  governorate: string;
  postalCode: string;
  country?: string;
}

interface ApiOptions extends RequestInit {
  idempotencyKey?: string;
}

async function checkoutClient(path: string, options: ApiOptions = {}) {
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

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || `HTTP ${response.status}`);
    (error as any).status = response.status;
    (error as any).code = data?.code;
    (error as any).data = data;
    throw error;
  }

  return data;
}

export async function createCheckoutSession({
  cartId,
  contact,
  shippingAddress,
  promoCode,
}: {
  cartId?: string | null;
  contact: CheckoutContact;
  shippingAddress: ShippingAddress;
  promoCode?: string | null;
}) {
  return checkoutClient('/checkout', {
    method: 'POST',
    idempotencyKey: `cko-${Date.now()}`,
    body: JSON.stringify({
      cartId: cartId || null,
      contact,
      shippingAddress,
      promoCode: promoCode || null,
    }),
  });
}

export async function createOrder({
  checkoutToken,
  paymentMethod = 'stub',
}: {
  checkoutToken: string;
  paymentMethod?: string;
}) {
  return checkoutClient('/orders', {
    method: 'POST',
    idempotencyKey: `ord-${Date.now()}`,
    body: JSON.stringify({
      checkoutToken,
      paymentMethod,
    }),
  });
}

export async function getOrder(orderNumber: string, email?: string) {
  const query = email ? `?email=${encodeURIComponent(email)}` : '';
  return checkoutClient(`/orders/${orderNumber}${query}`, {
    method: 'GET',
  });
}

export async function getShippingMethods() {
  return checkoutClient('/checkout/shipping-methods', {
    method: 'GET',
  });
}

export async function validatePromoCode(code: string, subtotal?: number, currency?: string) {
  const query = new URLSearchParams();
  if (subtotal !== undefined) query.set('subtotal', String(subtotal));
  if (currency) query.set('currency', currency);
  return checkoutClient(`/promo-codes/${encodeURIComponent(code)}/validate?${query.toString()}`, {
    method: 'GET',
  });
}

export type { CheckoutContact, ShippingAddress };
