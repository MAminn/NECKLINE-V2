'use client';

import { useState } from 'react';
import AdminImageUploader from '../AdminImageUploader';
import AdminSelect from '../AdminSelect';
import type { AdminHeaderSlide } from '../../../types/nickline';
import { adminInput, adminLabel } from '../adminStyles';

const LINK_OPTIONS = [
  { value: 'collection', label: 'Collection' },
  { value: 'story', label: 'Story' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'shop', label: 'Shop' },
];

interface Props {
  initial?: Partial<AdminHeaderSlide>;
  onSubmit: (data: Omit<AdminHeaderSlide, 'id'>) => Promise<void>;
  submitLabel: string;
}

export default function HeaderSlideForm({ initial = {}, onSubmit, submitLabel }: Props) {
  const [form, setForm] = useState({
    image: initial.image ?? '',
    title: initial.title ?? '',
    subtitle: initial.subtitle ?? '',
    description: initial.description ?? '',
    buttonText: initial.buttonText ?? 'SHOP NOW',
    linkTo: initial.linkTo ?? 'collection',
    order: initial.order ?? 0,
    active: initial.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        image: form.image,
        title: form.title,
        subtitle: form.subtitle,
        description: form.description,
        buttonText: form.buttonText,
        linkTo: form.linkTo,
        order: Number(form.order),
        active: form.active,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save slide');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
      <AdminImageUploader value={form.image} onChange={(url) => set('image', url)} label="Slide Image" />

      <div>
        <label style={adminLabel}>Title</label>
        <input required style={adminInput} value={form.title} onChange={(e) => set('title', e.target.value)} />
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={adminLabel}>Button Text</label>
          <input required style={adminInput} value={form.buttonText} onChange={(e) => set('buttonText', e.target.value)} />
        </div>
        <div>
          <label style={adminLabel}>Link To</label>
          <AdminSelect
            value={form.linkTo}
            onChange={(value) => set('linkTo', value)}
            options={LINK_OPTIONS}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={adminLabel}>Order</label>
          <input
            type="number"
            min={0}
            style={adminInput}
            value={form.order}
            onChange={(e) => set('order', Number(e.target.value))}
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer pb-2">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
            <span style={{ color: 'var(--color-text)', fontSize: 13 }}>Active</span>
          </label>
        </div>
      </div>

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
