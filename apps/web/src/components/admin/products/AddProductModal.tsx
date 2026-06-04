'use client';

import AdminModal from '../AdminModal';
import ProductForm from './ProductForm';
import { createAdminProduct } from '../../../lib/admin-api';
import type { AdminProduct } from '../../../types/nickline';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddProductModal({ open, onClose, onSuccess }: Props) {
  async function handleSubmit(data: Partial<AdminProduct>) {
    await createAdminProduct(data);
    onSuccess();
    onClose();
  }

  return (
    <AdminModal open={open} title="Add Product" onClose={onClose}>
      <ProductForm onSubmit={handleSubmit} submitLabel="Create Product" />
    </AdminModal>
  );
}
