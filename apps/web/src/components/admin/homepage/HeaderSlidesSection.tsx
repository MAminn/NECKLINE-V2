'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';
import AdminModal from '../AdminModal';
import HeaderSlideForm from './HeaderSlideForm';
import type { AdminHeaderSlide } from '../../../types/nickline';
import {
  getHeaderSlides,
  createHeaderSlide,
  updateHeaderSlide,
  deleteHeaderSlide,
} from '../../../lib/admin-api';

export default function HeaderSlidesSection() {
  const [slides, setSlides] = useState<AdminHeaderSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editSlide, setEditSlide] = useState<AdminHeaderSlide | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setLoading(true);
    getHeaderSlides()
      .then((data) => setSlides(data.sort((a, b) => a.order - b.order)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refresh]);

  async function handleCreate(data: Omit<AdminHeaderSlide, 'id'>) {
    await createHeaderSlide(data);
    setAddOpen(false);
    setRefresh((r) => r + 1);
  }

  async function handleUpdate(data: Omit<AdminHeaderSlide, 'id'>) {
    if (!editSlide) return;
    await updateHeaderSlide(editSlide.id, data);
    setEditSlide(null);
    setRefresh((r) => r + 1);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this slide?')) return;
    await deleteHeaderSlide(id);
    setRefresh((r) => r + 1);
  }

  async function toggleActive(slide: AdminHeaderSlide) {
    await updateHeaderSlide(slide.id, { active: !slide.active });
    setRefresh((r) => r + 1);
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-gold)' }}>
            Hero Slides
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            Manage homepage hero carousel content
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-widest"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          <Plus size={14} /> Add Slide
        </button>
      </div>

      {loading && <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Loading…</p>}

      {!loading && slides.length === 0 && (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--color-admin-border)' }}
        >
          <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>No hero slides yet</p>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Add your first slide to customize the homepage hero.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {!loading && slides.map((slide) => (
          <div
            key={slide.id}
            className="flex items-center gap-4 rounded-xl p-3 transition-colors"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-admin-border)' }}
          >
            <GripVertical size={16} style={{ color: 'var(--color-text-tertiary)' }} />

            {slide.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={slide.image} alt="" className="h-14 w-20 rounded-lg object-cover flex-shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                {slide.title}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                {slide.subtitle || slide.description || 'No subtitle'}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-gold)' }}>
                  {slide.buttonText} → {slide.linkTo}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    background: slide.active ? 'rgba(122,155,118,0.15)' : 'rgba(160,152,144,0.15)',
                    color: slide.active ? 'var(--success)' : 'var(--muted)',
                  }}
                >
                  {slide.active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  Order {slide.order}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleActive(slide)}
                className="rounded p-1.5 transition-colors"
                style={{ color: 'var(--color-text-tertiary)' }}
                aria-label={slide.active ? 'Deactivate' : 'Activate'}
                title={slide.active ? 'Deactivate' : 'Activate'}
              >
                {slide.active ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button
                onClick={() => setEditSlide(slide)}
                className="rounded p-1.5 transition-colors"
                style={{ color: 'var(--color-gold)' }}
                aria-label="Edit"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(slide.id)}
                className="rounded p-1.5 transition-colors"
                style={{ color: 'var(--color-primary)' }}
                aria-label="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AdminModal open={addOpen} title="Add Hero Slide" onClose={() => setAddOpen(false)}>
        <HeaderSlideForm onSubmit={handleCreate} submitLabel="Create Slide" />
      </AdminModal>

      <AdminModal open={!!editSlide} title="Edit Hero Slide" onClose={() => setEditSlide(null)}>
        {editSlide && <HeaderSlideForm initial={editSlide} onSubmit={handleUpdate} submitLabel="Save Changes" />}
      </AdminModal>
    </div>
  );
}
