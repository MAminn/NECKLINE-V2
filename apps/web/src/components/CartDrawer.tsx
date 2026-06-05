'use client';

import { X, ShoppingBag } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import CartLineItem from './CartLineItem';
import CartSummary from './CartSummary';

export default function CartDrawer() {
  const { cart, isOpen, closeDrawer, clearCart, isLoading } = useCart();

  return (
    <>
      {/* Backdrop — always in DOM so opacity transition fires without a React mount delay.
          backdrop-blur intentionally omitted: it forces full-page recomposition every frame. */}
      <div
        className={`fixed inset-0 z-[1200] bg-black/60 transition-opacity duration-200
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer panel — always in DOM, translate-only animation on a dedicated GPU layer */}
      <div
        role="dialog"
        aria-modal={isOpen ? 'true' : 'false'}
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 z-[1300] flex h-full w-full max-w-[420px] flex-col
          border-l border-border bg-surface shadow-[-8px_0_48px_rgba(0,0,0,0.6)]
          transform-gpu will-change-transform
          transition-transform duration-[220ms] ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-text-tertiary" strokeWidth={1.5} />
            <h2 className="font-display text-base uppercase tracking-[0.15em] text-text-primary">
              Your Cart
              {cart.itemCount > 0 && (
                <span className="ml-2 text-sm font-sans normal-case tracking-normal text-text-muted">
                  ({cart.itemCount})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={closeDrawer}
            className="rounded p-1.5 text-text-tertiary transition-colors hover:bg-white/5 hover:text-text-primary"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {cart.items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border">
                <ShoppingBag className="h-7 w-7 text-text-muted" strokeWidth={1} />
              </div>
              <div>
                <p className="font-display text-sm uppercase tracking-[0.15em] text-text-secondary">
                  Your cart is empty
                </p>
                <p className="mt-1.5 text-sm text-text-muted">
                  Explore the collection to find your scent.
                </p>
              </div>
              <a
                href="/shop"
                onClick={closeDrawer}
                className="mt-2 inline-flex items-center rounded-sm border border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-text-secondary transition-colors hover:border-primary/50 hover:text-primary"
              >
                Shop Collection
              </a>
            </div>
          ) : (
            <div className="space-y-5">
              {cart.items.map((item) => (
                <CartLineItem key={item.productId} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="shrink-0 border-t border-border bg-bg px-6 py-5">
            <CartSummary onCheckout={closeDrawer} />
            <button
              onClick={clearCart}
              disabled={isLoading}
              className="mt-4 w-full text-center text-xs uppercase tracking-widest text-text-muted transition-colors hover:text-text-secondary disabled:opacity-40"
            >
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
