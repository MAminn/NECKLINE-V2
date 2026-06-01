'use client';

import { useCart } from '../hooks/useCart';
import { formatPrice } from '../lib/formatPrice';

export default function CartSummary() {
  const { cart, isLoading } = useCart();

  const hasUnavailable = cart.items.some((i) => !i.available);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-text-primary">
        <span className="text-sm uppercase tracking-wide text-text-secondary">Subtotal</span>
        <span className="font-display text-lg uppercase tracking-wide">
          {cart.subtotal ? formatPrice(cart.subtotal.amount, cart.subtotal.currency) : '—'}
        </span>
      </div>

      <button
        disabled={isLoading || hasUnavailable || cart.items.length === 0}
        className="w-full rounded-md bg-gold py-3 font-medium uppercase tracking-wide text-bg transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Checkout
      </button>

      {hasUnavailable && (
        <p className="text-center text-xs text-primary">
          Remove unavailable items to proceed.
        </p>
      )}
    </div>
  );
}
