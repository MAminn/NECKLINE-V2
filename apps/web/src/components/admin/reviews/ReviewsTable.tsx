'use client';

import { useEffect, useState, useCallback } from 'react';
import { getTestimonials, deleteTestimonial, updateTestimonial } from '../../../lib/admin-api';
import type { Testimonial } from '../../../types/nickline';
import AdminModal from '../AdminModal';
import ReviewForm from './ReviewForm';

interface Props {
  onAddClick: () => void;
  refresh: number;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: 'var(--admin-gold)' }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

export default function ReviewsTable({ onAddClick, refresh }: Props) {
  const [reviews, setReviews] = useState<Testimonial[]>([]);
  const [search, setSearch] = useState('');
  const [starFilter, setStarFilter] = useState('');
  const [editReview, setEditReview] = useState<Testimonial | null>(null);

  const load = useCallback(() => {
    getTestimonials().then(setReviews).catch(() => {});
  }, [refresh]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this review?')) return;
    await deleteTestimonial(id).catch(() => {});
    load();
  }

  async function handleEdit(data: Omit<Testimonial, 'id' | 'deletedAt'>) {
    await updateTestimonial(editReview!.id, data);
    setEditReview(null);
    load();
  }

  const filtered = reviews.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (starFilter && r.rating !== Number(starFilter)) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-3 flex items-center gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="rounded-lg px-3 py-1.5 text-xs flex-1"
          style={{ background: '#1a0a0c', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', minWidth: 160 }}
        />
        <select
          value={starFilter}
          onChange={(e) => setStarFilter(e.target.value)}
          className="rounded-lg px-2 py-1.5 text-xs"
          style={{ background: '#1a0a0c', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
        >
          <option value="">All Stars</option>
          {[5,4,3,2,1].map((s) => <option key={s} value={s}>{s} ★</option>)}
        </select>
        <button onClick={onAddClick} className="rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ background: 'var(--admin-accent)', color: '#fff' }}>
          + Add Review
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--admin-border)' }}>
        <table className="w-full text-xs">
          <thead style={{ background: 'var(--admin-surface)' }}>
            <tr>
              {['Name', 'Product', 'Rating', 'Comment', 'Verified', 'Date', 'Actions'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: 'var(--admin-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--admin-border)' }}>
                <td className="px-3 py-2 font-semibold" style={{ color: 'var(--admin-text)' }}>{r.name}</td>
                <td className="px-3 py-2" style={{ color: 'var(--admin-text-muted)' }}>{r.product}</td>
                <td className="px-3 py-2"><Stars rating={r.rating} /></td>
                <td className="px-3 py-2 max-w-[160px] truncate" style={{ color: 'var(--admin-text)' }}>{r.comment}</td>
                <td className="px-3 py-2">
                  {r.verified ? <span style={{ color: '#4ade80' }}>✓</span> : <span style={{ color: 'var(--admin-text-muted)' }}>—</span>}
                </td>
                <td className="px-3 py-2" style={{ color: 'var(--admin-text-muted)' }}>{r.date}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button onClick={() => setEditReview(r)} className="text-[10px] underline" style={{ color: 'var(--admin-gold)' }}>Edit</button>
                    <button onClick={() => handleDelete(r.id)} className="text-[10px] underline" style={{ color: 'var(--admin-accent)' }}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={7} className="py-8 text-center" style={{ color: 'var(--admin-text-muted)' }}>No reviews</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminModal open={!!editReview} title="Edit Review" onClose={() => setEditReview(null)}>
        {editReview && <ReviewForm initial={editReview} onSubmit={handleEdit} submitLabel="Save Changes" />}
      </AdminModal>
    </div>
  );
}
