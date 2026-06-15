'use client';

import Link from 'next/link';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../lib/formatPrice';
import PromoCodeInput from './checkout/PromoCodeInput';

interface CartSummaryProps {
  onCheckout?: () => void;
}

export default function CartSummary({ onCheckout }: CartSummaryProps) {
  const { cart, isLoading, applyPromoCode, removePromoCode } = useCart();

  const hasUnavailable = cart.items.some((i: any) => !i.available);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-warm-white">
        <span className="text-sm uppercase tracking-wide text-muted">Subtotal</span>
        <span className="font-display text-lg uppercase tracking-wide">
          {cart.subtotal ? formatPrice(cart.subtotal.amount, cart.subtotal.currency) : '—'}
        </span>
      </div>

      {cart.discount && cart.discount.amount > 0 && (
        <div className="flex items-center justify-between text-sm text-crimson">
          <span>Discount {cart.discount.code ? `(${cart.discount.code})` : ''}</span>
          <span className="font-display">-{formatPrice(cart.discount.amount, cart.discount.currency)}</span>
        </div>
      )}

      {cart.shipping && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>Shipping</span>
          <span className="font-display">
            {cart.shipping.amount === 0 ? 'Free' : formatPrice(cart.shipping.amount, cart.shipping.currency)}
          </span>
        </div>
      )}

      {cart.total && (
        <div className="flex items-center justify-between border-t border-glass-border pt-2">
          <span className="font-display uppercase tracking-wide">Total</span>
          <span className="font-display text-original-gold">
            {formatPrice(cart.total.amount, cart.total.currency)}
          </span>
        </div>
      )}

      <Link
        href="/checkout"
        onClick={(e) => {
          if (isLoading || hasUnavailable || cart.items.length === 0) {
            e.preventDefault();
            return;
          }
          onCheckout?.();
        }}
        className={`block w-full rounded-md py-3 text-center font-medium uppercase tracking-wide transition-colors ${
          isLoading || hasUnavailable || cart.items.length === 0
            ? 'cursor-not-allowed bg-original-gold/50 text-noir/70'
            : 'bg-original-gold text-noir hover:brightness-110'
        }`}
      >
        Checkout
      </Link>

      {hasUnavailable && (
        <p className="text-center text-xs text-crimson">
          Remove unavailable items to proceed.
        </p>
      )}

      <PromoCodeInput
        appliedCode={cart.appliedPromoCode}
        onApply={applyPromoCode}
        onRemove={removePromoCode}
        isLoading={isLoading}
      />
    </div>
  );
}
