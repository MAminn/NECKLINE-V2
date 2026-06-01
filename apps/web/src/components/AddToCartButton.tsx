'use client';

import { useState } from 'react';
import { useCart } from '../hooks/useCart';

interface Props {
  productId: string;
  quantity: number;
  disabled?: boolean;
}

export default function AddToCartButton({ productId, quantity, disabled }: Props) {
  const { addItem, isLoading } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading) return;
    await addItem(productId, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`relative rounded-md px-8 py-3 font-medium uppercase tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
        justAdded
          ? 'bg-gold text-bg'
          : 'bg-primary text-text-inverse hover:bg-primary-hover'
      }`}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Adding…
        </span>
      ) : justAdded ? (
        'Added ✓'
      ) : (
        'Add to Cart'
      )}
    </button>
  );
}
