'use client';

import { useState } from 'react';
import ProductsTable from '../../../components/admin/products/ProductsTable';
import AddProductModal from '../../../components/admin/products/AddProductModal';

export default function ProductsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--admin-text)' }}>Products</h1>
      <ProductsTable onAddClick={() => setAddOpen(true)} refresh={refresh} />
      <AddProductModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => setRefresh((r) => r + 1)}
      />
    </div>
  );
}
