'use client';

import Link from 'next/link';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../lib/formatPrice';

export default function CartSummary() {
  const { cart, isLoading } = useCart();

  const hasUnavailable = cart.items.some((i: any) => !i.available);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-text-primary">
        <span className="text-sm uppercase tracking-wide text-text-secondary">Subtotal</span>
        <span className="font-display text-lg uppercase tracking-wide">
          {cart.subtotal ? formatPrice(cart.subtotal.amount, cart.subtotal.currency) : '—'}
        </span>
      </div>

      <Link
        href="/checkout"
        onClick={(e) => {
          if (isLoading || hasUnavailable || cart.items.length === 0) {
            e.preventDefault();
          }
        }}
        className={`block w-full rounded-md py-3 text-center font-medium uppercase tracking-wide transition-colors ${
          isLoading || hasUnavailable || cart.items.length === 0
            ? 'cursor-not-allowed bg-gold/50 text-bg/70'
            : 'bg-gold text-bg hover:brightness-110'
        }`}
      >
        Checkout
      </Link>

      {hasUnavailable && (
        <p className="text-center text-xs text-primary">
          Remove unavailable items to proceed.
        </p>
      )}
    </div>
  );
}
