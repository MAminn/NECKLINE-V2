'use client';

import { useState } from 'react';
import { deleteAdminCustomer, getAdminOrders } from '../../../lib/admin-api';
import type { AdminCustomer, AdminOrder } from '../../../types/nickline';
import { useEffect } from 'react';
import { formatPrice } from '../../../lib/formatPrice';

interface Props {
  customer: AdminCustomer | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function CustomerDetailSidebar({ customer, onClose, onDeleted }: Props) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!customer) return;
    getAdminOrders({ search: customer.email, limit: 10 })
      .then((d) => setOrders(d.orders))
      .catch(() => {});
  }, [customer]);

  if (!customer) return null;

  async function handleDelete() {
    if (!confirm(`Delete account for ${customer!.email}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteAdminCustomer(customer!.email);
      onDeleted();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  const isVip = customer.ordersCount >= 3 || customer.lifetimeValue >= 5_000_000;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col shadow-2xl"
        style={{ background: 'var(--color-admin-surface)', borderLeft: '1px solid var(--color-admin-border)' }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-admin-border)' }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{customer.name}</h2>
            {isVip && <span className="text-[10px] font-bold" style={{ color: 'var(--color-gold)' }}>VIP</span>}
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text-tertiary)' }}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-gold)' }}>Contact</p>
            <p className="text-xs" style={{ color: 'var(--color-text)' }}>{customer.email}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Joined {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </section>
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-gold)' }}>Stats</p>
            <p className="text-xs" style={{ color: 'var(--color-text)' }}>{customer.ordersCount} orders · {formatPrice(customer.lifetimeValue, customer.currency || 'EGP')} lifetime</p>
          </section>
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-gold)' }}>Order History</p>
            {orders.length === 0 && <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>No orders found</p>}
            <ul className="space-y-2">
              {orders.map((o) => (
                <li key={o.id} className="flex justify-between text-xs">
                  <span style={{ color: 'var(--color-text)' }}>{o.orderNumber}</span>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>{formatPrice(o.total, o.currency || 'EGP')} · {o.status}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="px-5 py-4" style={{ borderTop: '1px solid var(--color-admin-border)' }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full rounded-lg py-2 text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(210,27,39,0.15)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', opacity: deleting ? 0.6 : 1 }}
          >
            {deleting ? 'Deleting…' : 'Delete Account'}
          </button>
        </div>
      </div>
    </>
  );
}
