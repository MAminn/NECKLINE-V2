'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '../lib/formatPrice';
import { apiClient } from '../lib/api';

interface Order {
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  lineItems: { title: string; quantity: number }[];
}

export default function OrderHistoryList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient('/orders')
      .then((data) => {
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load orders');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-surface-alt" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-primary">{error}</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg bg-surface-alt p-6 text-center">
        <p className="text-text-secondary">No orders yet.</p>
        <Link href="/" className="mt-2 inline-block text-sm text-gold underline">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.orderNumber} className="rounded-lg bg-surface-alt p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-sm uppercase tracking-wide">{order.orderNumber}</p>
              <p className="text-xs text-text-secondary">
                {new Date(order.createdAt).toLocaleDateString()} · {order.lineItems.length} item(s)
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-gold">{formatPrice(order.total, order.currency)}</p>
              <span className="inline-block rounded-full bg-gold/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-gold">
                {order.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
