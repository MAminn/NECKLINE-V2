'use client';

import { useState } from 'react';
import ReviewsTable from '../../../components/admin/reviews/ReviewsTable';
import AdminModal from '../../../components/admin/AdminModal';
import ReviewForm from '../../../components/admin/reviews/ReviewForm';
import { createTestimonial } from '../../../lib/admin-api';
import type { Testimonial } from '../../../types/nickline';

export default function ReviewsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);

  async function handleAdd(data: Omit<Testimonial, 'id' | 'deletedAt'>) {
    await createTestimonial(data);
    setAddOpen(false);
    setRefresh((r) => r + 1);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>Reviews</h1>
      <ReviewsTable onAddClick={() => setAddOpen(true)} refresh={refresh} />
      <AdminModal open={addOpen} title="Add Review" onClose={() => setAddOpen(false)}>
        <ReviewForm onSubmit={handleAdd} submitLabel="Create Review" />
      </AdminModal>
    </div>
  );
}
