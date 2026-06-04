'use client';

import { useEffect, useState } from 'react';
import { getAdminOffers, createAdminOffer, deleteAdminOffer } from '../../../lib/admin-api';
import type { AdminPromoCode } from '../../../types/nickline';

export default function CampaignsSection() {
  const [offers, setOffers] = useState<AdminPromoCode[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', type: 'percentage', value: '', minOrderAmount: '', endDate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    getAdminOffers().then((d) => setOffers(d.offers)).catch(() => {});
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createAdminOffer({
        description: form.description,
        type: form.type,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        endDate: form.endDate || undefined,
      });
      setForm({ description: '', type: 'percentage', value: '', minOrderAmount: '', endDate: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this campaign offer?')) return;
    await deleteAdminOffer(id).catch(() => {});
    load();
  }

  const inputStyle = { background: '#1a0a0c', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 8, padding: '6px 10px', fontSize: 12 } as React.CSSProperties;

  function isActive(o: AdminPromoCode) {
    return o.active && (!o.endDate || new Date(o.endDate) > new Date());
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--admin-gold)' }}>Campaign Offers</h3>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg px-3 py-1.5 text-xs font-bold uppercase"
          style={{ background: 'var(--admin-accent)', color: '#fff' }}
        >
          + Add Campaign
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 rounded-xl p-4 space-y-3" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
          <div className="grid grid-cols-2 gap-2">
            <input required placeholder="Description" style={{ ...inputStyle, gridColumn: '1/-1' }} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="col-span-2" />
            <select style={inputStyle} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
            <input required type="number" placeholder="Value" style={inputStyle} value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
            <input type="number" placeholder="Min order amount" style={inputStyle} value={form.minOrderAmount} onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))} />
            <input type="datetime-local" style={inputStyle} value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={saving} className="rounded-lg px-4 py-1.5 text-xs font-bold" style={{ background: 'var(--admin-accent)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Creating…' : 'Create'}
          </button>
        </form>
      )}

      <div className="grid gap-3">
        {offers.map((o) => {
          const active = isActive(o);
          return (
            <div key={o.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold" style={{ color: 'var(--admin-text)' }}>{o.description}</p>
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: active ? 'rgba(74,222,128,0.15)' : 'rgba(210,27,39,0.15)', color: active ? '#4ade80' : 'var(--admin-accent)' }}>
                    {active ? 'ACTIVE' : 'EXPIRED'}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                  {o.type === 'percentage' ? `${o.value}% off` : `${(o.value / 100).toFixed(2)} EGP off`}
                  {o.endDate ? ` · until ${new Date(o.endDate).toLocaleDateString()}` : ''}
                </p>
              </div>
              <button onClick={() => handleDelete(o.id)} className="text-xs underline" style={{ color: 'var(--admin-accent)' }}>Delete</button>
            </div>
          );
        })}
        {!offers.length && <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>No campaign offers yet.</p>}
      </div>
    </div>
  );
}
