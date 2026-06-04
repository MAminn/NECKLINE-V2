'use client';

import { useEffect, useState } from 'react';
import { getAdminCoupons, createAdminCoupon, deleteAdminCoupon } from '../../../lib/admin-api';
import type { AdminPromoCode } from '../../../types/nickline';

export default function CouponsSection() {
  const [coupons, setCoupons] = useState<AdminPromoCode[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', type: 'percentage', value: '', minOrderAmount: '', usageLimit: '', endDate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    getAdminCoupons().then((d) => setCoupons(d.coupons)).catch(() => {});
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createAdminCoupon({
        code: form.code,
        type: form.type,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        endDate: form.endDate || undefined,
      });
      setForm({ code: '', type: 'percentage', value: '', minOrderAmount: '', usageLimit: '', endDate: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this coupon?')) return;
    await deleteAdminCoupon(id).catch(() => {});
    load();
  }

  const inputStyle = { background: '#1a0a0c', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 8, padding: '6px 10px', fontSize: 12 } as React.CSSProperties;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--admin-gold)' }}>Coupon Codes</h3>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg px-3 py-1.5 text-xs font-bold uppercase"
          style={{ background: 'var(--admin-accent)', color: '#fff' }}
        >
          + Add Coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 rounded-xl p-4 space-y-3" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
          <div className="grid grid-cols-2 gap-2">
            <input required placeholder="CODE" style={inputStyle} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
            <select style={inputStyle} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
            <input required type="number" placeholder="Value" style={inputStyle} value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
            <input type="number" placeholder="Min order amount" style={inputStyle} value={form.minOrderAmount} onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))} />
            <input type="number" placeholder="Usage limit" style={inputStyle} value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} />
            <input type="datetime-local" placeholder="Expiry date" style={inputStyle} value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={saving} className="rounded-lg px-4 py-1.5 text-xs font-bold" style={{ background: 'var(--admin-accent)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Creating…' : 'Create'}
          </button>
        </form>
      )}

      <div className="grid gap-3">
        {coupons.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
            <div>
              <p className="text-sm font-bold font-mono" style={{ color: 'var(--admin-text)' }}>{c.code}</p>
              <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                {c.type === 'percentage' ? `${c.value}% off` : `${(c.value / 100).toFixed(2)} EGP off`}
                {c.minOrderAmount ? ` · min ${(c.minOrderAmount / 100).toFixed(0)} EGP` : ''}
                {c.usageLimit ? ` · ${c.usageCount}/${c.usageLimit} uses` : ` · ${c.usageCount} uses`}
              </p>
            </div>
            <button onClick={() => handleDelete(c.id)} className="text-xs underline" style={{ color: 'var(--admin-accent)' }}>Delete</button>
          </div>
        ))}
        {!coupons.length && <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>No coupons yet.</p>}
      </div>
    </div>
  );
}
