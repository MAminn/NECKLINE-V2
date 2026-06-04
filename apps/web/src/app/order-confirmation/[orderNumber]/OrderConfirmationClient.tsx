'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getOrder } from '../../../lib/checkout-api';
import { formatPrice } from '../../../lib/formatPrice';

export default function OrderConfirmationClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderNumber = params.orderNumber as string;
  const email = searchParams.get('email') || '';

  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!orderNumber) return;

    let pollInterval: NodeJS.Timeout | null = null;
    let pollCount = 0;
    const maxPolls = 40; // ~2 minutes at 3s intervals

    async function fetchOrder() {
      try {
        const data = await getOrder(orderNumber, email || undefined);
        setOrder(data.order);

        // If order is pending_payment, start polling
        if (data.order?.status === 'pending_payment') {
          setIsPolling(true);
          if (!pollInterval) {
            pollInterval = setInterval(() => {
              pollCount++;
              if (pollCount >= maxPolls) {
                if (pollInterval) clearInterval(pollInterval);
                setIsPolling(false);
                return;
              }
              getOrder(orderNumber, email || undefined)
                .then((refresh) => {
                  setOrder(refresh.order);
                  if (refresh.order?.status === 'confirmed') {
                    if (pollInterval) clearInterval(pollInterval);
                    setIsPolling(false);
                  }
                })
                .catch(() => {
                  // Silently retry on poll errors
                });
            }, 3000);
          }
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Order not found');
        setLoading(false);
      }
    }

    fetchOrder();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [orderNumber, email]);

  if (loading) {
    return (
      <main className="min-h-screen bg-bg text-text-primary">
        <div className="mx-auto max-w-container px-4 py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="mt-4 text-text-secondary">Loading order...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-bg text-text-primary">
        <div className="mx-auto max-w-container px-4 py-12 text-center">
          <h1 className="font-display text-3xl uppercase tracking-wide">Order Not Found</h1>
          <p className="mt-4 text-text-secondary">{error || 'We could not find this order.'}</p>
          <Link href="/" className="mt-6 inline-block rounded-md bg-primary px-8 py-3 font-medium uppercase tracking-wide text-text-inverse transition-colors hover:bg-primary-hover">
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  const isPending = order.status === 'pending_payment';

  return (
    <main className="min-h-screen bg-bg text-text-primary">
      <div className="mx-auto max-w-container px-4 py-12">
        <div className="text-center">
          {isPending ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              </div>
              <h1 className="mt-4 font-display text-3xl uppercase tracking-wide">
                {isPolling ? 'Confirming Your Payment...' : 'Payment Pending'}
              </h1>
              <p className="mt-2 text-text-secondary">
                {isPolling
                  ? 'We are waiting for payment confirmation. This usually takes a few seconds.'
                  : 'Your payment is taking longer than expected. We will update this page automatically.'}
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
                <svg className="h-8 w-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="mt-4 font-display text-3xl uppercase tracking-wide">Order Confirmed</h1>
              <p className="mt-2 text-text-secondary">
                Thank you, {order.customerName}. Your order has been placed.
              </p>
            </>
          )}
          <p className="mt-1 font-display text-lg text-gold">{order.orderNumber}</p>
        </div>

        <div className="mt-8 mx-auto max-w-2xl space-y-4">
          <div className="rounded-lg bg-surface-alt p-6">
            <h2 className="font-display text-sm uppercase tracking-wide text-text-secondary">Order Details</h2>
            <div className="mt-3 space-y-2 text-sm">
              {order.lineItems.map((item: any) => (
                <div key={item.sku} className="flex justify-between">
                  <span>{item.title} × {item.quantity}</span>
                  <span className="font-display">{formatPrice(item.lineTotal, item.currency)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-border pt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Subtotal</span>
                <span className="font-display">{formatPrice(order.subtotal, order.currency)}</span>
              </div>
              {order.discount && order.discount.amountApplied > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">
                    Discount {order.discount.code ? `(${order.discount.code})` : ''}
                  </span>
                  <span className="font-display text-primary">
                    -{formatPrice(order.discount.amountApplied, order.discount.currency || order.currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-secondary">Shipping</span>
                <span className="font-display">
                  {order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost, order.currency)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-lg">
                <span className="font-display uppercase tracking-wide">Total</span>
                <span className="font-display uppercase tracking-wide text-gold">
                  {formatPrice(order.total, order.currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-surface-alt p-6">
            <h2 className="font-display text-sm uppercase tracking-wide text-text-secondary">Shipping To</h2>
            <div className="mt-2 text-sm">
              <p className="font-medium">{order.customerName}</p>
              <p>{order.customerEmail}</p>
              <p>{order.customerPhone}</p>
              <p className="mt-1 text-text-secondary">
                {order.shippingAddress.street}, {order.shippingAddress.city},{' '}
                {order.shippingAddress.governorate}, {order.shippingAddress.postalCode}
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="inline-block rounded-md bg-primary px-8 py-3 font-medium uppercase tracking-wide text-text-inverse transition-colors hover:bg-primary-hover"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
