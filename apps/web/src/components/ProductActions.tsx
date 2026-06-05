'use client';

import { useState } from 'react';
import QuantityStepper from './QuantityStepper';
import AddToCartButton from './AddToCartButton';

interface Props {
  productId: string;
  disabled?: boolean;
}

export default function ProductActions({ productId, disabled }: Props) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <QuantityStepper disabled={disabled} onChange={setQuantity} />
      <AddToCartButton productId={productId} quantity={quantity} disabled={disabled} />
    </div>
  );
}
