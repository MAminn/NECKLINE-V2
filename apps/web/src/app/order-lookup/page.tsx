'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getOrder } from '../../lib/checkout-api';
import { formatPrice } from '../../lib/formatPrice';

export default function OrderLookupPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const data = await getOrder(orderNumber.trim(), email.trim() || undefined);
      setOrder(data.order);
    } catch (err: any) {
      setError('Order not found. Please check your order number and email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg text-text-primary">
      <div className="mx-auto max-w-container px-4 py-12">
        <h1 className="font-display text-3xl uppercase tracking-wide">Order Lookup</h1>
        <p className="mt-2 text-text-secondary">Find your order by number and email.</p>

        <form onSubmit={handleSubmit} className="mt-8 mx-auto max-w-md space-y-4">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-text-secondary">Order Number</label>
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              placeholder="NECK-1234567890-ABCD"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-text-secondary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              placeholder="you@example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gold py-3 font-medium uppercase tracking-wide text-bg transition-colors hover:brightness-110 disabled:opacity-50"
          >
            {loading ? 'Looking up...' : 'Find Order'}
          </button>

          {error && <p className="text-center text-sm text-primary">{error}</p>}
        </form>

        {order && (
          <div className="mt-8 mx-auto max-w-md rounded-lg bg-surface-alt p-6">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg">{order.orderNumber}</span>
              <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gold">
                {order.status}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-sm">
              {order.lineItems.map((item: any) => (
                <div key={item.sku} className="flex justify-between">
                  <span>{item.title} × {item.quantity}</span>
                  <span className="font-display">{formatPrice(item.lineTotal, item.currency)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-border pt-2 flex justify-between font-display">
              <span>Total</span>
              <span className="text-gold">{formatPrice(order.total, order.currency)}</span>
            </div>
            <Link
              href={`/order-confirmation/${order.orderNumber}?email=${encodeURIComponent(email)}`}
              className="mt-4 block text-center text-sm text-gold underline"
            >
              View Full Details
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
