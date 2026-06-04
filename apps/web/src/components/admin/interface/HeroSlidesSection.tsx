'use client';

import { useEffect, useState } from 'react';
import { getHeaderSlides, deleteHeaderSlide } from '../../../lib/admin-api';
import type { AdminHeaderSlide } from '../../../types/nickline';
import SlideModal from './SlideModal';

export default function HeroSlidesSection() {
  const [slides, setSlides] = useState<AdminHeaderSlide[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editSlide, setEditSlide] = useState<AdminHeaderSlide | null>(null);

  function load() {
    getHeaderSlides().then(setSlides).catch(() => {});
  }
  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this slide?')) return;
    await deleteHeaderSlide(id).catch(() => {});
    load();
  }

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--admin-gold)' }}>Hero Slides</h3>
        <button onClick={() => setAddOpen(true)} className="rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ background: 'var(--admin-accent)', color: '#fff' }}>
          + Add Slide
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {slides.map((s) => (
          <div key={s.id} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--admin-border)' }}>
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt={s.title} className="h-24 w-full object-cover" />
            )}
            <div className="p-2">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--admin-text)' }}>{s.title}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-bold rounded px-1.5 py-0.5" style={{ background: s.active ? 'rgba(74,222,128,0.15)' : 'rgba(210,27,39,0.15)', color: s.active ? '#4ade80' : 'var(--admin-accent)' }}>
                  #{s.order} · {s.active ? 'Active' : 'Hidden'}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setEditSlide(s)} className="text-[10px] underline" style={{ color: 'var(--admin-gold)' }}>Edit</button>
                  <button onClick={() => handleDelete(s.id)} className="text-[10px] underline" style={{ color: 'var(--admin-accent)' }}>Del</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!slides.length && <p className="text-xs col-span-3" style={{ color: 'var(--admin-text-muted)' }}>No slides yet.</p>}
      </div>

      {addOpen && <SlideModal onClose={() => setAddOpen(false)} onSuccess={load} />}
      {editSlide && <SlideModal slide={editSlide} onClose={() => setEditSlide(null)} onSuccess={load} />}
    </div>
  );
}
