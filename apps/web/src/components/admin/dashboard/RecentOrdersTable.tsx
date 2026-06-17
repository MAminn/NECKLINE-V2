'use client';

import { useEffect, useState } from 'react';
import { getAdminOrders } from '../../../lib/admin-api';
import type { AdminOrder } from '../../../types/nickline';
import { formatPrice } from '../../../lib/formatPrice';
import { ORDER_STATUS_COLORS } from '../../../lib/statusColors';
import { DEFAULT_CURRENCY } from '../../../lib/constants';

function StatusBadge({ status }: { status: string }) {
  const color = ORDER_STATUS_COLORS[status] ?? 'var(--color-gold)';
  return (
    <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: `${color}1a`, color }}>
      {status}
    </span>
  );
}

export default function RecentOrdersTable() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAdminOrders({ limit: 10 })
      .then((d) => setOrders(d.orders))
      .catch(() => {});
  }, []);

  const filtered = orders.filter((o) =>
    !search ||
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-gold)' }}>
          Recent Orders
        </h3>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="rounded-lg px-2 py-1 text-xs"
          style={{ background: 'var(--color-surface-input)', border: '1px solid var(--color-admin-border)', color: 'var(--color-text)', width: 120 }}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-admin-border)' }}>
              {['Order', 'Customer', 'Items', 'Total', 'Status'].map((h) => (
                <th key={h} className="pb-2 pr-4 text-left font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid var(--color-admin-border)' }}>
                <td className="py-2 pr-4 font-mono" style={{ color: 'var(--color-text)' }}>{o.orderNumber}</td>
                <td className="py-2 pr-4 truncate max-w-[100px]" style={{ color: 'var(--color-text)' }}>{o.customerName}</td>
                <td className="py-2 pr-4" style={{ color: 'var(--color-text-tertiary)' }}>{o.itemCount}</td>
                <td className="py-2 pr-4 font-semibold" style={{ color: 'var(--color-text)' }}>{formatPrice(o.total, o.currency || DEFAULT_CURRENCY)}</td>
                <td className="py-2"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={5} className="py-4 text-center" style={{ color: 'var(--color-text-tertiary)' }}>No orders</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
