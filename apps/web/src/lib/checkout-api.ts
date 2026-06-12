import { apiClient } from './api';

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
  return apiClient('/checkout', {
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
  return apiClient('/orders', {
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
  return apiClient(`/orders/${orderNumber}${query}`, {
    method: 'GET',
  });
}

export async function getShippingMethods() {
  return apiClient('/checkout/shipping-methods', {
    method: 'GET',
  });
}

export async function validatePromoCode(code: string, subtotal?: number, currency?: string) {
  const query = new URLSearchParams();
  if (subtotal !== undefined) query.set('subtotal', String(subtotal));
  if (currency) query.set('currency', currency);
  return apiClient(`/promo-codes/${encodeURIComponent(code)}/validate?${query.toString()}`, {
    method: 'GET',
  });
}

export type { CheckoutContact, ShippingAddress };
