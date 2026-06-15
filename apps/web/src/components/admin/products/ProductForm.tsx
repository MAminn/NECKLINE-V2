'use client';

import { useState } from 'react';
import AdminMultiImageUploader from '../AdminMultiImageUploader';
import type { AdminProduct } from '../../../types/nickline';
import { adminInput, adminLabel } from '../adminStyles';

const CATEGORIES = ['Men', 'Women', 'Unisex'];

interface Props {
  initial?: Partial<AdminProduct>;
  onSubmit: (data: Partial<AdminProduct>) => Promise<void>;
  submitLabel: string;
}

export default function ProductForm({ initial = {}, onSubmit, submitLabel }: Props) {
  const initialImages = initial.galleryImages?.length
    ? initial.galleryImages
    : initial.images?.length
    ? initial.images
    : initial.image
    ? [initial.image]
    : [];

  const [form, setForm] = useState({
    name: initial.name ?? '',
    sku: initial.sku ?? '',
    category: initial.category ?? '',
    price: initial.price ?? 0,
    stockOnHand: initial.stockOnHand ?? 0,
    subtitle: initial.subtitle ?? '',
    description: initial.description ?? '',
    images: initialImages,
    purchasable: initial.purchasable ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(key: string, val: unknown) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        name: form.name,
        sku: form.sku,
        category: form.category,
        price: Math.round(Number(form.price)),
        stockOnHand: Math.round(Number(form.stockOnHand)),
        subtitle: form.subtitle,
        description: form.description,
        images: form.images,
        galleryImages: form.images,
        image: form.images[0] || '',
        purchasable: form.purchasable,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={adminLabel}>Name</label>
          <input required style={adminInput} value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label style={adminLabel}>SKU</label>
          <input required style={adminInput} value={form.sku} onChange={(e) => set('sku', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={adminLabel}>Price (minor units)</label>
          <input
            required
            type="number"
            min={0}
            style={adminInput}
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
          />
        </div>
        <div>
          <label style={adminLabel}>Stock</label>
          <input
            required
            type="number"
            min={0}
            style={adminInput}
            value={form.stockOnHand}
            onChange={(e) => set('stockOnHand', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label style={adminLabel}>Category</label>
        <select style={adminInput} value={form.category} onChange={(e) => set('category', e.target.value)}>
          <option value="">— Select —</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={adminLabel}>Subtitle</label>
        <input style={adminInput} value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
      </div>

      <div>
        <label style={adminLabel}>Description</label>
        <textarea
          rows={3}
          style={{ ...adminInput, resize: 'vertical' }}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>

      <AdminMultiImageUploader
        label="Product Images"
        images={form.images}
        onChange={(images) => set('images', images)}
      />

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.purchasable} onChange={(e) => set('purchasable', e.target.checked)} />
        <span style={{ color: 'var(--color-text)', fontSize: 13 }}>Purchasable</span>
      </label>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg py-2.5 text-sm font-bold uppercase tracking-widest transition-opacity"
        style={{ background: 'var(--color-primary)', color: '#fff', opacity: saving ? 0.6 : 1 }}
      >
        {saving ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
