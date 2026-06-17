export const ORDER_STATUS_COLORS: Record<string, string> = {
  confirmed: '#4ade80',
  cancelled: 'var(--color-primary)',
  pending: 'var(--color-gold)',
  pending_payment: 'var(--color-gold)',
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
