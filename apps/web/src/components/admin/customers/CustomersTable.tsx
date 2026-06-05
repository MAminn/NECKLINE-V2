'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { getAdminCustomers } from '../../../lib/admin-api';
import type { AdminCustomer, CustomerTag } from '../../../types/nickline';

const TABS: ReadonlyArray<'ALL' | CustomerTag> = ['ALL', 'NEW', 'VIP'];

// Tag → Tailwind classes (resolves to tokens via tailwind.config).
const TAG_CLASSES: Record<CustomerTag, string> = {
  VIP: 'text-gold bg-gold/10',
  NEW: 'text-info-fg bg-info-bg',
  ACTIVE: 'text-success-fg bg-success-bg',
};

interface Props {
  onSelectCustomer: (c: AdminCustomer) => void;
  refresh?: number;
}

export default function CustomersTable({ onSelectCustomer, refresh = 0 }: Props) {
  const [allCustomers, setAllCustomers] = useState<AdminCustomer[]>([]);
  const [kpis, setKpis] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'ALL' | CustomerTag>('ALL');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getAdminCustomers({ page, search: search || undefined })
      .then((d) => {
        setAllCustomers(d.customers);
        setTotal(d.total);
        setKpis(d.kpis);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, refresh]);

  useEffect(() => {
    load();
  }, [load]);

  const customers = useMemo(() => {
    if (tab === 'ALL') return allCustomers;
    return allCustomers.filter((c) => c.tag === tab);
  }, [allCustomers, tab]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="mb-4 flex gap-4 text-xs">
        {[['Total', kpis.total], ['New This Week', kpis.newThisWeek], ['Returning', kpis.returning]].map(([l, v]) => (
          <div key={String(l)} className="rounded-lg border border-admin-border bg-admin-surface px-3 py-2">
            <p className="font-semibold uppercase tracking-widest text-[10px] text-gold">{l}</p>
            <p className="text-base font-bold text-text-primary">{v ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full border border-admin-border px-3 py-1 text-xs font-semibold uppercase tracking-widest transition-colors ${
              tab === t ? 'bg-primary text-text-primary' : 'bg-transparent text-text-tertiary'
            }`}>
            {t}
          </button>
        ))}
        <input value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name or email…"
          className="ml-auto w-[200px] rounded-lg border border-admin-border bg-surface-input px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted" />
      </div>

      <div className="overflow-hidden rounded-xl border border-admin-border">
        <table className="w-full text-xs">
          <thead className="bg-admin-surface">
            <tr>
              {['', 'Name', 'Email', 'Orders', 'Lifetime Value', 'Status'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold text-text-tertiary">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="py-8 text-center text-text-tertiary">Loading…</td></tr>
            )}
            {!loading && customers.map((c) => (
              <tr key={c.id} className="cursor-pointer border-t border-admin-border" onClick={() => onSelectCustomer(c)}>
                <td className="px-3 py-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-text-primary">
                    {c.name[0]?.toUpperCase()}
                  </div>
                </td>
                <td className="px-3 py-2 font-semibold text-text-primary">{c.name}</td>
                <td className="px-3 py-2 text-text-tertiary">{c.email}</td>
                <td className="px-3 py-2 text-text-primary">{c.ordersCount}</td>
                <td className="px-3 py-2 text-text-primary">{(c.lifetimeValue / 100).toLocaleString()} EGP</td>
                <td className="px-3 py-2">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${TAG_CLASSES[c.tag]}`}>{c.tag}</span>
                </td>
              </tr>
            ))}
            {!loading && !customers.length && (
              <tr><td colSpan={6} className="py-8 text-center text-text-tertiary">No customers</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-xs">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="text-text-tertiary disabled:opacity-40">← Prev</button>
          <span className="text-text-primary">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="text-text-tertiary disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
