'use client';

import Link from 'next/link';
import { useCart } from '../../hooks/useCart';
import CartLineItem from '../../components/CartLineItem';
import CartSummary from '../../components/CartSummary';

export default function CartPage() {
  const { cart, clearCart, isLoading } = useCart();

  return (
    <main className="min-h-screen bg-bg text-text-primary">
      <div className="mx-auto max-w-container px-4 py-12">
        <h1 className="font-display text-3xl uppercase tracking-wide">Your Cart</h1>

        {cart.items.length === 0 ? (
          <div className="mt-12 text-center text-text-secondary">
            <p className="font-display uppercase tracking-wide">Your cart is empty</p>
            <p className="mt-2 text-sm">Explore the collection to find your scent.</p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-md bg-primary px-8 py-3 font-medium uppercase tracking-wide text-text-inverse transition-colors hover:bg-primary-hover"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Items */}
            <div className="space-y-4 lg:col-span-2">
              {cart.items.map((item) => (
                <CartLineItem key={item.productId} item={item} />
              ))}
              <button
                onClick={clearCart}
                disabled={isLoading}
                className="text-sm text-text-secondary underline transition-colors hover:text-text-primary disabled:opacity-50"
              >
                Clear Cart
              </button>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-surface-alt p-6">
              <CartSummary />
              <Link
                href="/"
                className="mt-4 block text-center text-sm text-text-secondary underline transition-colors hover:text-text-primary"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
