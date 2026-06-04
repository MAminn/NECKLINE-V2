'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAdminProducts, deleteAdminProduct } from '../../../lib/admin-api';
import type { AdminProduct } from '../../../types/nickline';
import EditProductModal from './EditProductModal';

const STATUS_COLORS: Record<string, string> = {
  'ACTIVE': '#4ade80',
  'LOW STOCK': 'var(--admin-gold)',
  'OUT OF STOCK': 'var(--admin-accent)',
};

interface Props {
  onAddClick: () => void;
  refresh: number;
}

export default function ProductsTable({ onAddClick, refresh }: Props) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [kpis, setKpis] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getAdminProducts({ page, search: search || undefined, status: status || undefined })
      .then((d) => { setProducts(d.products); setTotal(d.total); setKpis(d.kpis); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, status, refresh]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    await deleteAdminProduct(id).catch(() => {});
    load();
  }

  const totalPages = Math.ceil(total / 8);

  return (
    <div>
      {/* KPI strip */}
      <div className="mb-4 flex gap-4 text-xs">
        {[['Total', kpis.total], ['Active', kpis.active], ['Out of Stock', kpis.outOfStock], ['Total Views', kpis.totalViews]].map(([l, v]) => (
          <div key={String(l)} className="rounded-lg px-3 py-2" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
            <p style={{ color: 'var(--admin-gold)' }} className="font-semibold uppercase tracking-widest text-[10px]">{l}</p>
            <p style={{ color: 'var(--admin-text)' }} className="text-base font-bold">{v ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-3 flex items-center gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name or SKU…"
          className="rounded-lg px-3 py-1.5 text-xs flex-1"
          style={{ background: '#1a0a0c', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', minWidth: 160 }}
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg px-2 py-1.5 text-xs"
          style={{ background: '#1a0a0c', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
        >
          <option value="">All Statuses</option>
          <option>ACTIVE</option>
          <option>LOW STOCK</option>
          <option>OUT OF STOCK</option>
        </select>
        <button
          onClick={onAddClick}
          className="rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
          style={{ background: 'var(--admin-accent)', color: '#fff' }}
        >
          + Add Product
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--admin-border)' }}>
        <table className="w-full text-xs">
          <thead style={{ background: 'var(--admin-surface)' }}>
            <tr>
              {['', 'Name', 'SKU', 'Category', 'Price', 'Stock', 'Status', 'Views', 'Sales', 'Actions'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: 'var(--admin-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={10} className="py-8 text-center" style={{ color: 'var(--admin-text-muted)' }}>Loading…</td></tr>
            )}
            {!loading && products.map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid var(--admin-border)' }}>
                <td className="px-3 py-2">
                  {p.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" className="h-8 w-8 rounded object-cover" />
                  )}
                </td>
                <td className="px-3 py-2 font-semibold" style={{ color: 'var(--admin-text)' }}>{p.name}</td>
                <td className="px-3 py-2 font-mono" style={{ color: 'var(--admin-text-muted)' }}>{p.sku}</td>
                <td className="px-3 py-2" style={{ color: 'var(--admin-text-muted)' }}>{p.category}</td>
                <td className="px-3 py-2" style={{ color: 'var(--admin-text)' }}>{(p.price / 100).toLocaleString()}</td>
                <td className="px-3 py-2" style={{ color: 'var(--admin-text)' }}>{p.stockOnHand}</td>
                <td className="px-3 py-2">
                  <span className="rounded px-2 py-0.5 text-[10px] font-bold" style={{ background: `${STATUS_COLORS[p.status] ?? '#999'}1a`, color: STATUS_COLORS[p.status] ?? '#999' }}>
                    {p.status}
                  </span>
                </td>
                <td className="px-3 py-2" style={{ color: 'var(--admin-text-muted)' }}>{p.views}</td>
                <td className="px-3 py-2" style={{ color: 'var(--admin-text-muted)' }}>{p.sales}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button onClick={() => setEditProduct(p)} className="text-[10px] underline" style={{ color: 'var(--admin-gold)' }}>Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-[10px] underline" style={{ color: 'var(--admin-accent)' }}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !products.length && (
              <tr><td colSpan={10} className="py-8 text-center" style={{ color: 'var(--admin-text-muted)' }}>No products</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-xs">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ color: 'var(--admin-text-muted)' }}>← Prev</button>
          <span style={{ color: 'var(--admin-text)' }}>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ color: 'var(--admin-text-muted)' }}>Next →</button>
        </div>
      )}

      <EditProductModal product={editProduct} onClose={() => setEditProduct(null)} onSuccess={load} />
    </div>
  );
}
