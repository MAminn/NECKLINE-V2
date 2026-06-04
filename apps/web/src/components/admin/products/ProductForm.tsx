'use client';

import { useState } from 'react';
import AdminImageUploader from '../AdminImageUploader';
import type { AdminProduct } from '../../../types/nickline';

interface ProductFormProps {
  initial?: Partial<AdminProduct>;
  onSubmit: (data: Partial<AdminProduct>) => Promise<void>;
  submitLabel: string;
}

const CATEGORIES = ['Balms & Solid Perfumes', 'Accessories', 'Gift Sets', 'Limited Edition'];

export default function ProductForm({ initial = {}, onSubmit, submitLabel }: ProductFormProps) {
  const [form, setForm] = useState({
    name: initial.name ?? '',
    sku: initial.sku ?? '',
    category: initial.category ?? '',
    price: initial.price ?? 0,
    stockOnHand: initial.stockOnHand ?? 0,
    subtitle: initial.subtitle ?? '',
    description: (initial as Record<string, unknown>).description as string ?? '',
    image0: initial.galleryImages?.[0] ?? initial.image ?? '',
    image1: initial.galleryImages?.[1] ?? '',
    image2: initial.galleryImages?.[2] ?? '',
    purchasable: initial.purchasable ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const images = [form.image0, form.image1, form.image2].filter(Boolean);
      await onSubmit({
        name: form.name,
        sku: form.sku,
        category: form.category,
        price: Math.round(Number(form.price)),
        stockOnHand: Math.round(Number(form.stockOnHand)),
        subtitle: form.subtitle,
        description: form.description,
        images,
        purchasable: form.purchasable,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    background: '#1a0a0c',
    border: '1px solid var(--admin-border)',
    color: 'var(--admin-text)',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 13,
    width: '100%',
  } as React.CSSProperties;

  const labelStyle = { color: 'var(--admin-gold)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 } as React.CSSProperties;

  function set(key: string, val: unknown) { setForm((f) => ({ ...f, [key]: val })); }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={labelStyle}>Name</label>
          <input required style={inputStyle} value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>SKU</label>
          <input required style={inputStyle} value={form.sku} onChange={(e) => set('sku', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={labelStyle}>Price (minor units, EGP)</label>
          <input required type="number" min={0} style={inputStyle} value={form.price} onChange={(e) => set('price', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Stock</label>
          <input required type="number" min={0} style={inputStyle} value={form.stockOnHand} onChange={(e) => set('stockOnHand', e.target.value)} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Category</label>
        <select style={inputStyle} value={form.category} onChange={(e) => set('category', e.target.value)}>
          <option value="">— Select —</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Subtitle</label>
        <input style={inputStyle} value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>
      <AdminImageUploader label="Hero Image (Image 1)" value={form.image0} onChange={(v) => set('image0', v)} />
      <AdminImageUploader label="Gallery Image 2" value={form.image1} onChange={(v) => set('image1', v)} />
      <AdminImageUploader label="Gallery Image 3" value={form.image2} onChange={(v) => set('image2', v)} />
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.purchasable} onChange={(e) => set('purchasable', e.target.checked)} />
        <span style={{ color: 'var(--admin-text)', fontSize: 13 }}>Purchasable</span>
      </label>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg py-2 text-sm font-bold uppercase tracking-widest transition-opacity"
        style={{ background: 'var(--admin-accent)', color: '#fff', opacity: saving ? 0.6 : 1 }}
      >
        {saving ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
