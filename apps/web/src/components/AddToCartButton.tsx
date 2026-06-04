'use client';

import { useState } from 'react';
import { Check, Loader2, ShoppingBag } from 'lucide-react';
import { useCart } from '../hooks/useCart';

interface Props {
  productId: string;
  quantity: number;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export default function AddToCartButton({ productId, quantity, disabled, size = 'sm' }: Props) {
  const { addItem, isLoading } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading) return;
    await addItem(productId, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const sizeClasses = size === 'md'
    ? 'px-8 py-3 text-sm tracking-widest gap-2'
    : 'px-3.5 py-2 text-xs tracking-widest gap-1.5';

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center rounded-sm font-semibold uppercase transition-all duration-200
        disabled:cursor-not-allowed disabled:opacity-50
        ${sizeClasses}
        ${justAdded
          ? 'bg-gold text-bg scale-95'
          : 'bg-primary text-white hover:bg-primary-hover hover:shadow-glow active:scale-95'
        }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Adding</span>
        </>
      ) : justAdded ? (
        <>
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span>Added</span>
        </>
      ) : (
        <>
          <ShoppingBag className="h-3.5 w-3.5" />
          <span>Add</span>
        </>
      )}
    </button>
  );
}
