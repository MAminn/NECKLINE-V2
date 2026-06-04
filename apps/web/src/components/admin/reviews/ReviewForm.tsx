'use client';

import { useState } from 'react';
import type { Testimonial } from '../../../types/nickline';

interface Props {
  initial?: Partial<Testimonial>;
  onSubmit: (data: Omit<Testimonial, 'id' | 'deletedAt'>) => Promise<void>;
  submitLabel: string;
}

export default function ReviewForm({ initial = {}, onSubmit, submitLabel }: Props) {
  const [form, setForm] = useState({
    name: initial.name ?? '',
    product: initial.product ?? '',
    rating: initial.rating ?? 5,
    comment: initial.comment ?? '',
    verified: initial.verified ?? false,
    date: initial.date ?? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const inputStyle = { background: '#1a0a0c', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 8, padding: '6px 10px', fontSize: 13, width: '100%' } as React.CSSProperties;

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

  const labelStyle = { color: 'var(--admin-gold)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 } as React.CSSProperties;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label style={labelStyle}>Customer Name</label><input required style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
      <div><label style={labelStyle}>Product</label><input required style={inputStyle} value={form.product} onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))} /></div>
      <div>
        <label style={labelStyle}>Rating</label>
        <div className="flex gap-1">
          {[1,2,3,4,5].map((s) => (
            <button key={s} type="button" onClick={() => setForm((f) => ({ ...f, rating: s }))} style={{ color: s <= form.rating ? 'var(--admin-gold)' : 'var(--admin-border)', fontSize: 20 }}>★</button>
          ))}
        </div>
      </div>
      <div><label style={labelStyle}>Comment</label><textarea required rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} /></div>
      <div><label style={labelStyle}>Display Date (e.g. Jun 5, 2026)</label><input required style={inputStyle} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.verified} onChange={(e) => setForm((f) => ({ ...f, verified: e.target.checked }))} />
        <span style={{ color: 'var(--admin-gold)', fontSize: 13, fontWeight: 700 }}>Verified Buyer</span>
      </label>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button type="submit" disabled={saving} className="w-full rounded-lg py-2 text-sm font-bold uppercase tracking-widest" style={{ background: 'var(--admin-accent)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
