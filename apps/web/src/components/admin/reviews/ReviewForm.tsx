'use client';

import { useState } from 'react';
import type { Testimonial } from '../../../types/nickline';
import { adminInput, adminLabel } from '../adminStyles';

const textareaStyle = { ...adminInput, resize: 'vertical' } as const;

interface Props {
  initial?: Partial<Testimonial>;
  onSubmit: (data: Omit<Testimonial, 'id' | 'deletedAt'>) => Promise<void>;
  submitLabel: string;
}

export default function ReviewForm({ initial = {}, onSubmit, submitLabel }: Props) {
  const [form, setForm] = useState({
    name:     initial.name     ?? '',
    product:  initial.product  ?? '',
    rating:   initial.rating   ?? 5,
    comment:  initial.comment  ?? '',
    verified: initial.verified ?? false,
    date:     initial.date     ?? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  function set<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit({ name: form.name, product: form.product, rating: form.rating, comment: form.comment, verified: form.verified, date: form.date });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label style={adminLabel}>Customer Name</label><input required style={adminInput} value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
      <div><label style={adminLabel}>Product</label><input required style={adminInput} value={form.product} onChange={(e) => set('product', e.target.value)} /></div>
      <div>
        <label style={adminLabel}>Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} type="button" onClick={() => set('rating', s)}
              style={{ color: s <= form.rating ? 'var(--admin-gold)' : 'var(--admin-border)', fontSize: 20 }}>★</button>
          ))}
        </div>
      </div>
      <div><label style={adminLabel}>Comment</label><textarea required rows={4} style={textareaStyle} value={form.comment} onChange={(e) => set('comment', e.target.value)} /></div>
      <div><label style={adminLabel}>Display Date</label><input required style={adminInput} value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.verified} onChange={(e) => set('verified', e.target.checked)} />
        <span style={{ color: 'var(--admin-gold)', fontSize: 13, fontWeight: 700 }}>Verified Buyer</span>
      </label>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button type="submit" disabled={saving} className="w-full rounded-lg py-2 text-sm font-bold uppercase tracking-widest"
        style={{ background: 'var(--admin-accent)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
