'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAdminCustomers } from '../../../lib/admin-api';
import type { AdminCustomer } from '../../../types/nickline';

const TABS = ['ALL', 'NEW', 'VIP'];

function customerTag(c: AdminCustomer) {
  if (c.ordersCount >= 3 || c.lifetimeValue >= 5_000_000) return 'VIP';
  if (c.ordersCount === 0) return 'NEW';
  return 'ACTIVE';
}

const TAG_COLORS: Record<string, string> = { VIP: 'var(--admin-gold)', NEW: '#60a5fa', ACTIVE: '#4ade80' };

interface Props {
  onSelectCustomer: (c: AdminCustomer) => void;
  refresh?: number;
}

export default function CustomersTable({ onSelectCustomer, refresh = 0 }: Props) {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [kpis, setKpis] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getAdminCustomers({ page, search: search || undefined })
      .then((d) => {
        let customers = d.customers;
        if (tab === 'VIP') customers = customers.filter((c) => customerTag(c) === 'VIP');
        if (tab === 'NEW') customers = customers.filter((c) => customerTag(c) === 'NEW');
        setCustomers(customers);
        setTotal(d.total);
        setKpis(d.kpis);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, tab, refresh]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      {/* KPI strip */}
      <div className="mb-4 flex gap-4 text-xs">
        {[['Total', kpis.total], ['New This Week', kpis.newThisWeek], ['Returning', kpis.returning]].map(([l, v]) => (
          <div key={String(l)} className="rounded-lg px-3 py-2" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
            <p style={{ color: 'var(--admin-gold)' }} className="font-semibold uppercase tracking-widest text-[10px]">{l}</p>
            <p style={{ color: 'var(--admin-text)' }} className="text-base font-bold">{v ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 flex items-center gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
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
          placeholder="Search name or email…"
          className="ml-auto rounded-lg px-3 py-1.5 text-xs"
          style={{ background: '#1a0a0c', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', width: 200 }}
        />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--admin-border)' }}>
        <table className="w-full text-xs">
          <thead style={{ background: 'var(--admin-surface)' }}>
            <tr>
              {['', 'Name', 'Email', 'Orders', 'Lifetime Value', 'Status'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: 'var(--admin-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="py-8 text-center" style={{ color: 'var(--admin-text-muted)' }}>Loading…</td></tr>}
            {!loading && customers.map((c) => {
              const tag = customerTag(c);
              return (
                <tr
                  key={c.id}
                  className="cursor-pointer"
                  style={{ borderTop: '1px solid var(--admin-border)' }}
                  onClick={() => onSelectCustomer(c)}
                >
                  <td className="px-3 py-2">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--admin-accent)', color: '#fff' }}>
                      {c.name[0]?.toUpperCase()}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-semibold" style={{ color: 'var(--admin-text)' }}>{c.name}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--admin-text-muted)' }}>{c.email}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--admin-text)' }}>{c.ordersCount}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--admin-text)' }}>{(c.lifetimeValue / 100).toLocaleString()} EGP</td>
                  <td className="px-3 py-2">
                    <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase" style={{ color: TAG_COLORS[tag], background: `${TAG_COLORS[tag]}1a` }}>{tag}</span>
                  </td>
                </tr>
              );
            })}
            {!loading && !customers.length && <tr><td colSpan={6} className="py-8 text-center" style={{ color: 'var(--admin-text-muted)' }}>No customers</td></tr>}
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
