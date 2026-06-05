'use client';

import { useEffect, useState } from 'react';
import { getAdminOffers, createAdminOffer, deleteAdminOffer } from '../../../lib/admin-api';
import type { AdminPromoCode } from '../../../types/nickline';
import { adminInputSm } from '../adminStyles';

const EMPTY_FORM = { description: '', type: 'percentage', value: '', minOrderAmount: '', endDate: '' };

function isActive(o: AdminPromoCode) {
  return o.active && (!o.endDate || new Date(o.endDate) > new Date());
}

export default function CampaignsSection() {
  const [offers,   setOffers]   = useState<AdminPromoCode[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  function load() { getAdminOffers().then((d) => setOffers(d.offers)).catch(() => {}); }
  useEffect(load, []);

  function setField(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createAdminOffer({
        description: form.description, type: form.type, value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        endDate: form.endDate || undefined,
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
    if (!confirm('Delete this campaign offer?')) return;
    await deleteAdminOffer(id).catch(() => {});
    load();
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-gold)' }}>Campaign Offers</h3>
        <button onClick={() => setShowForm((v) => !v)} className="rounded-lg px-3 py-1.5 text-xs font-bold uppercase"
          style={{ background: 'var(--color-primary)', color: '#fff' }}>
          + Add Campaign
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 rounded-xl p-4 space-y-3"
          style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}>
          <div className="grid grid-cols-2 gap-2">
            <input required placeholder="Description" style={{ ...adminInputSm, gridColumn: '1/-1' }} className="col-span-2"
              value={form.description} onChange={(e) => setField('description', e.target.value)} />
            <select style={adminInputSm} value={form.type} onChange={(e) => setField('type', e.target.value)}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
            <input required type="number" placeholder="Value"            style={adminInputSm} value={form.value}          onChange={(e) => setField('value', e.target.value)} />
            <input          type="number" placeholder="Min order amount" style={adminInputSm} value={form.minOrderAmount} onChange={(e) => setField('minOrderAmount', e.target.value)} />
            <input          type="datetime-local"                         style={adminInputSm} value={form.endDate}        onChange={(e) => setField('endDate', e.target.value)} />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={saving} className="rounded-lg px-4 py-1.5 text-xs font-bold"
            style={{ background: 'var(--color-primary)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Creating…' : 'Create'}
          </button>
        </form>
      )}

      <div className="grid gap-3">
        {offers.map((o) => {
          const active = isActive(o);
          return (
            <div key={o.id} className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{o.description}</p>
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ background: active ? 'rgba(74,222,128,0.15)' : 'rgba(210,27,39,0.15)', color: active ? '#4ade80' : 'var(--color-primary)' }}>
                    {active ? 'ACTIVE' : 'EXPIRED'}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {o.type === 'percentage' ? `${o.value}% off` : `${(o.value / 100).toFixed(2)} EGP off`}
                  {o.endDate ? ` · until ${new Date(o.endDate).toLocaleDateString()}` : ''}
                </p>
              </div>
              <button onClick={() => handleDelete(o.id)} className="text-xs underline" style={{ color: 'var(--color-primary)' }}>Delete</button>
            </div>
          );
        })}
        {!offers.length && <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>No campaign offers yet.</p>}
      </div>
    </div>
  );
}
