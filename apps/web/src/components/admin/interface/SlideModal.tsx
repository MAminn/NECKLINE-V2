'use client';

import { useState } from 'react';
import AdminModal from '../AdminModal';
import AdminImageUploader from '../AdminImageUploader';
import { createHeaderSlide, updateHeaderSlide } from '../../../lib/admin-api';
import type { AdminHeaderSlide } from '../../../types/nickline';
import { adminInput, adminLabel } from '../adminStyles';

const textareaStyle = { ...adminInput, resize: 'vertical' } as const;

interface Props {
  slide?: AdminHeaderSlide | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SlideModal({ slide, onClose, onSuccess }: Props) {
  const isEdit = !!slide;
  const [form, setForm] = useState({
    image:       slide?.image       ?? '',
    title:       slide?.title       ?? '',
    subtitle:    slide?.subtitle    ?? '',
    description: slide?.description ?? '',
    buttonText:  slide?.buttonText  ?? 'Shop Now',
    linkTo:      slide?.linkTo      ?? 'collection',
    order:       slide?.order       ?? 0,
    active:      slide?.active      ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  function set(key: string, val: unknown) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) await updateHeaderSlide(slide!.id, form as Partial<AdminHeaderSlide>);
      else        await createHeaderSlide(form as Omit<AdminHeaderSlide, 'id'>);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminModal open title={isEdit ? 'Edit Slide' : 'Add Slide'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
        <AdminImageUploader label="Slide Image" value={form.image} onChange={(v) => set('image', v)} />
        <div><label style={adminLabel}>Title</label><input required style={adminInput} value={form.title} onChange={(e) => set('title', e.target.value)} /></div>
        <div><label style={adminLabel}>Subtitle</label><input style={adminInput} value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} /></div>
        <div><label style={adminLabel}>Description</label><textarea rows={2} style={textareaStyle} value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label style={adminLabel}>Button Text</label><input style={adminInput} value={form.buttonText} onChange={(e) => set('buttonText', e.target.value)} /></div>
          <div>
            <label style={adminLabel}>Link To</label>
            <select style={adminInput} value={form.linkTo} onChange={(e) => set('linkTo', e.target.value)}>
              <option value="collection">Collection</option>
              <option value="story">Story</option>
              <option value="reviews">Reviews</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 items-end">
          <div><label style={adminLabel}>Order</label><input type="number" style={adminInput} value={form.order} onChange={(e) => set('order', Number(e.target.value))} /></div>
          <label className="flex items-center gap-2 cursor-pointer pb-1.5">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
            <span style={{ color: 'var(--color-text)', fontSize: 13 }}>Active</span>
          </label>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button type="submit" disabled={saving} className="w-full rounded-lg py-2 text-sm font-bold uppercase tracking-widest"
          style={{ background: 'var(--color-primary)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Slide'}
        </button>
      </form>
    </AdminModal>
  );
}
