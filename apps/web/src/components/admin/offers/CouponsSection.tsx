'use client';

import { useEffect, useState } from 'react';
import { getAdminCoupons, createAdminCoupon, deleteAdminCoupon } from '../../../lib/admin-api';
import type { AdminPromoCode } from '../../../types/nickline';
import { adminInputSm } from '../adminStyles';

const EMPTY_FORM = { code: '', type: 'percentage', value: '', minOrderAmount: '', usageLimit: '', endDate: '' };

export default function CouponsSection() {
  const [coupons,   setCoupons]   = useState<AdminPromoCode[]>([]);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  function load() { getAdminCoupons().then((d) => setCoupons(d.coupons)).catch(() => {}); }
  useEffect(load, []);

  function setField(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createAdminCoupon({
        code: form.code, type: form.type, value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        usageLimit:     form.usageLimit     ? Number(form.usageLimit)     : undefined,
        endDate:        form.endDate        || undefined,
      });
      setForm(EMPTY_FORM);
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

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--admin-gold)' }}>Coupon Codes</h3>
        <button onClick={() => setShowForm((v) => !v)} className="rounded-lg px-3 py-1.5 text-xs font-bold uppercase"
          style={{ background: 'var(--admin-accent)', color: '#fff' }}>
          + Add Coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 rounded-xl p-4 space-y-3"
          style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
          <div className="grid grid-cols-2 gap-2">
            <input required placeholder="CODE"           style={adminInputSm} value={form.code}           onChange={(e) => setField('code', e.target.value)} />
            <select                                       style={adminInputSm} value={form.type}           onChange={(e) => setField('type', e.target.value)}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
            <input required type="number" placeholder="Value"            style={adminInputSm} value={form.value}           onChange={(e) => setField('value', e.target.value)} />
            <input          type="number" placeholder="Min order amount" style={adminInputSm} value={form.minOrderAmount}  onChange={(e) => setField('minOrderAmount', e.target.value)} />
            <input          type="number" placeholder="Usage limit"      style={adminInputSm} value={form.usageLimit}      onChange={(e) => setField('usageLimit', e.target.value)} />
            <input          type="datetime-local"                         style={adminInputSm} value={form.endDate}         onChange={(e) => setField('endDate', e.target.value)} />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={saving} className="rounded-lg px-4 py-1.5 text-xs font-bold"
            style={{ background: 'var(--admin-accent)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Creating…' : 'Create'}
          </button>
        </form>
      )}

      <div className="grid gap-3">
        {coupons.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
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
