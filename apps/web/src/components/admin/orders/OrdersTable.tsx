'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAdminOrders } from '../../../lib/admin-api';
import type { AdminOrder } from '../../../types/nickline';

const FILTER_TABS = ['ALL', 'UNFULFILLED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#4ade80',
  cancelled: 'var(--admin-accent)',
  pending: 'var(--admin-gold)',
  pending_payment: 'var(--admin-gold)',
  unfulfilled: 'var(--admin-text-muted)',
  processing: 'var(--admin-gold)',
  shipped: '#60a5fa',
  delivered: '#4ade80',
};

interface Props {
  onSelectOrder: (order: AdminOrder) => void;
  refresh?: number;
}

export default function OrdersTable({ onSelectOrder, refresh = 0 }: Props) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = {
      page,
      search: search || undefined,
      fulfillmentStatus: tab !== 'ALL' ? tab.toLowerCase() : undefined,
    };
    getAdminOrders(params)
      .then((d) => { setOrders(d.orders); setTotal(d.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, tab, refresh]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        {FILTER_TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest transition-colors"
            style={{
              background: tab === t ? 'var(--admin-accent)' : 'transparent',
              color: tab === t ? '#fff' : 'var(--admin-text-muted)',
              border: '1px solid var(--admin-border)',
            }}
          >
            {t}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search order / customer…"
          className="ml-auto rounded-lg px-3 py-1.5 text-xs"
          style={{ background: '#1a0a0c', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', width: 200 }}
        />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--admin-border)' }}>
        <table className="w-full text-xs">
          <thead style={{ background: 'var(--admin-surface)' }}>
            <tr>
              {['Order', 'Customer', 'Items', 'Total', 'Payment', 'Fulfillment'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: 'var(--admin-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="py-8 text-center" style={{ color: 'var(--admin-text-muted)' }}>Loading…</td></tr>
            )}
            {!loading && orders.map((o) => (
              <tr
                key={o.id}
                className="cursor-pointer transition-colors"
                style={{ borderTop: '1px solid var(--admin-border)' }}
                onClick={() => onSelectOrder(o)}
              >
                <td className="px-3 py-2 font-mono font-semibold" style={{ color: 'var(--admin-text)' }}>{o.orderNumber}</td>
                <td className="px-3 py-2" style={{ color: 'var(--admin-text)' }}>{o.customerName}</td>
                <td className="px-3 py-2" style={{ color: 'var(--admin-text-muted)' }}>{o.itemCount}</td>
                <td className="px-3 py-2 font-semibold" style={{ color: 'var(--admin-text)' }}>{(o.total / 100).toLocaleString()} EGP</td>
                <td className="px-3 py-2">
                  <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase" style={{ color: STATUS_COLORS[o.status], background: `${STATUS_COLORS[o.status]}1a` }}>
                    {o.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase" style={{ color: STATUS_COLORS[o.fulfillmentStatus], background: `${STATUS_COLORS[o.fulfillmentStatus]}1a` }}>
                    {o.fulfillmentStatus}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && !orders.length && (
              <tr><td colSpan={6} className="py-8 text-center" style={{ color: 'var(--admin-text-muted)' }}>No orders</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-xs">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ color: 'var(--admin-text-muted)' }}>← Prev</button>
          <span style={{ color: 'var(--admin-text)' }}>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ color: 'var(--admin-text-muted)' }}>Next →</button>
        </div>
      )}
    </div>
  );
}
