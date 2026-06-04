'use client';

import AdminModal from '../AdminModal';
import ProductForm from './ProductForm';
import { updateAdminProduct } from '../../../lib/admin-api';
import type { AdminProduct } from '../../../types/nickline';

interface Props {
  product: AdminProduct | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditProductModal({ product, onClose, onSuccess }: Props) {
  if (!product) return null;

  async function handleSubmit(data: Partial<AdminProduct>) {
    await updateAdminProduct(product!.id, data);
    onSuccess();
    onClose();
  }

  return (
    <AdminModal open={!!product} title="Edit Product" onClose={onClose}>
      <ProductForm initial={product} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </AdminModal>
  );
}
