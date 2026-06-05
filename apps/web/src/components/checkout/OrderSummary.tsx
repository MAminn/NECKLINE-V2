'use client';

import { formatPrice } from '../../lib/formatPrice';

interface LineItem {
  sku: string;
  title: string;
  unitPrice: number;
  currency: string;
  quantity: number;
  lineTotal: number;
}

interface DiscountInfo {
  code: string | null;
  type: string;
  value: number;
  amount: number;
  currency: string;
}

interface OrderSummaryProps {
  lineItems: LineItem[];
  subtotal: number;
  discount?: DiscountInfo | null;
  shipping: { method: string; cost: number; currency: string };
  total: number;
  currency: string;
}

export default function OrderSummary({ lineItems, subtotal, discount, shipping, total, currency }: OrderSummaryProps) {
  return (
    <div className="rounded-lg bg-surface-alt p-6">
      <h3 className="font-display text-lg uppercase tracking-wide">Order Summary</h3>

      <div className="mt-4 space-y-3">
        {lineItems.map((item) => (
          <div key={item.sku} className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-text-secondary">Qty: {item.quantity}</p>
            </div>
            <span className="font-display">{formatPrice(item.lineTotal, item.currency)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-border pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Subtotal</span>
          <span className="font-display">{formatPrice(subtotal, currency)}</span>
        </div>
        {discount && discount.amount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">
              Discount {discount.code ? `(${discount.code})` : ''}
            </span>
            <span className="font-display text-primary">-{formatPrice(discount.amount, discount.currency)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Shipping ({shipping.method})</span>
          <span className="font-display">
            {shipping.cost === 0 ? 'Free' : formatPrice(shipping.cost, shipping.currency)}
          </span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-lg">
          <span className="font-display uppercase tracking-wide">Total</span>
          <span className="font-display uppercase tracking-wide text-gold">
            {formatPrice(total, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
