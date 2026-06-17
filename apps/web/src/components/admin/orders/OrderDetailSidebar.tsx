'use client';

import { useState } from 'react';
import { updateAdminOrder } from '../../../lib/admin-api';
import type { AdminOrder } from '../../../types/nickline';
import { formatPrice } from '../../../lib/formatPrice';
import { ORDER_STATUS_COLORS } from '../../../lib/statusColors';
import { DEFAULT_CURRENCY } from '../../../lib/constants';

const FULFILLMENT_STEPS = ['unfulfilled', 'processing', 'shipped', 'delivered'] as const;
type FulfillmentStatus = typeof FULFILLMENT_STEPS[number];

interface Props {
  order: AdminOrder | null;
  onClose: () => void;
  onUpdated: (order: AdminOrder) => void;
}

export default function OrderDetailSidebar({ order, onClose, onUpdated }: Props) {
  const [tracking, setTracking] = useState(order?.trackingNumber ?? '');
  const [saving, setSaving] = useState(false);

  if (!order) return null;

  async function advanceFulfillment(newStatus: FulfillmentStatus) {
    setSaving(true);
    try {
      const updated = await updateAdminOrder(order!.id, { fulfillmentStatus: newStatus });
      onUpdated(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  async function saveTracking() {
    setSaving(true);
    try {
      const updated = await updateAdminOrder(order!.id, { trackingNumber: tracking });
      onUpdated(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const currentIdx = FULFILLMENT_STEPS.indexOf(order.fulfillmentStatus as FulfillmentStatus);
  const nextStatus = FULFILLMENT_STEPS[currentIdx + 1];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      {/* Panel */}
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col shadow-2xl"
        style={{ background: 'var(--color-admin-surface)', borderLeft: '1px solid var(--color-admin-border)' }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-admin-border)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{order.orderNumber}</h2>
          <button onClick={onClose} style={{ color: 'var(--color-text-tertiary)' }}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Customer */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-gold)' }}>Customer</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{order.customerName}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{order.customerEmail}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {order.shippingAddress?.city}, {order.shippingAddress?.governorate}
            </p>
          </section>

          {/* Items */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-gold)' }}>Items</p>
            <p className="text-xs" style={{ color: 'var(--color-text)' }}>{order.itemsSummary}</p>
            <p className="text-sm font-bold mt-1" style={{ color: 'var(--color-text)' }}>
              Total: {formatPrice(order.total, order.currency || DEFAULT_CURRENCY)}
            </p>
          </section>

          {/* Status */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-gold)' }}>Fulfillment</p>
            <div className="flex gap-1 flex-wrap mb-3">
              {FULFILLMENT_STEPS.map((s, idx) => (
                <span
                  key={s}
                  className="rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                  style={{
                    background: idx <= currentIdx ? 'rgba(210,27,39,0.15)' : 'transparent',
                    color: idx <= currentIdx ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                    border: '1px solid var(--color-admin-border)',
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
            {nextStatus && (
              <button
                onClick={() => advanceFulfillment(nextStatus)}
                disabled={saving}
                className="w-full rounded-lg py-2 text-xs font-bold uppercase tracking-widest"
                style={{ background: 'var(--color-primary)', color: '#fff', opacity: saving ? 0.6 : 1 }}
              >
                Mark as {nextStatus.toUpperCase()}
              </button>
            )}
          </section>

          {/* Payment */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-gold)' }}>Payment</p>
            <span className="rounded px-2 py-0.5 text-[10px] font-bold" style={{ background: `${ORDER_STATUS_COLORS[order.status] ?? '#999'}1a`, color: ORDER_STATUS_COLORS[order.status] ?? '#999' }}>
              {order.status}
            </span>
          </section>

          {/* Tracking */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-gold)' }}>Tracking Number</p>
            <input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="TRK-EGY-…"
              className="w-full rounded-lg px-3 py-1.5 text-xs mb-2"
              style={{ background: 'var(--color-surface-input)', border: '1px solid var(--color-admin-border)', color: 'var(--color-text)' }}
            />
            <button
              onClick={saveTracking}
              disabled={saving}
              className="w-full rounded-lg py-1.5 text-xs font-bold"
              style={{ background: 'rgba(194,159,104,0.15)', color: 'var(--color-gold)', border: '1px solid var(--color-gold)' }}
            >
              Save Tracking
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
