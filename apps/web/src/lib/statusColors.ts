// Order.status (payment/lifecycle) — see apps/api/src/models/Order.js
export const ORDER_PAYMENT_STATUS_COLORS: Record<string, string> = {
  confirmed: '#4ade80',
  cancelled: 'var(--color-primary)',
  pending: 'var(--color-gold)',
  pending_payment: 'var(--color-gold)',
};

// Order.fulfillmentStatus — a separate enum from status, kept in its own map
// so the two domains can never collide under the same string key.
export const ORDER_FULFILLMENT_STATUS_COLORS: Record<string, string> = {
  unfulfilled: 'var(--color-text-tertiary)',
  processing: 'var(--color-gold)',
  shipped: '#60a5fa',
  delivered: '#4ade80',
};

export const PRODUCT_STATUS_COLORS: Record<string, string> = {
  'ACTIVE': '#4ade80',
  'LOW STOCK': 'var(--color-gold)',
  'OUT OF STOCK': 'var(--color-primary)',
};
