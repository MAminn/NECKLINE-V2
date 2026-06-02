'use client';

import { useCart } from '../hooks/useCart';
import CartLineItem from './CartLineItem';
import CartSummary from './CartSummary';

export default function CartDrawer() {
  const { cart, isOpen, closeDrawer, clearCart, isLoading } = useCart();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md transform bg-surface-alt shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-display text-xl uppercase tracking-wide text-text-primary">
              Your Cart
            </h2>
            <button
              onClick={closeDrawer}
              className="text-text-secondary transition-colors hover:text-text-primary"
              aria-label="Close cart"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {cart.items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-text-secondary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="mb-4 opacity-50"
                >
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <p className="font-display uppercase tracking-wide">Your cart is empty</p>
                <p className="mt-2 text-sm">Explore the collection to find your scent.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <CartLineItem key={item.productId} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.items.length > 0 && (
            <div className="border-t border-border px-6 py-4">
              <CartSummary onCheckout={closeDrawer} />
              <button
                onClick={clearCart}
                disabled={isLoading}
                className="mt-4 w-full text-center text-sm text-text-secondary underline transition-colors hover:text-text-primary disabled:opacity-50"
              >
                Clear Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
