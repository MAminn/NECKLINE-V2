'use client';

import Image from 'next/image';
import { X, RotateCcw } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { CartItem } from '../contexts/CartContext';
import { formatPrice } from '../lib/formatPrice';

interface Props {
  item: CartItem;
}

export default function CartLineItem({ item }: Props) {
  const { updateQuantity, removeItem, refresh, isLoading } = useCart();

  const handleQtyChange = (delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty >= 1 && newQty <= 99) {
      updateQuantity(item.productId, newQty);
    }
  };

  return (
    <div className="flex gap-4 rounded-lg bg-noir-lift p-3">
      {/* Image */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
        {item.image ? (
          <Image src={item.image} alt={item.name} fill className="object-cover" />
        ) : (
          <div className="h-full w-full bg-noir-lift" />
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="font-display text-sm uppercase tracking-wide text-warm-white">
              {item.name}
            </h3>
            <button
              onClick={() => removeItem(item.productId)}
              disabled={isLoading}
              className="ml-2 rounded p-0.5 text-muted transition-colors hover:text-crimson disabled:opacity-50"
              aria-label="Remove item"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
          <p className="text-xs text-muted">{item.sku}</p>
        </div>

        <div className="flex items-center justify-between">
          {/* Quantity stepper */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQtyChange(-1)}
              disabled={isLoading || item.quantity <= 1}
              className="flex h-7 w-7 items-center justify-center rounded border border-glass-border text-muted transition-colors hover:border-muted disabled:opacity-50"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-medium text-warm-white">
              {item.quantity}
            </span>
            <button
              onClick={() => handleQtyChange(1)}
              disabled={isLoading || item.quantity >= 99}
              className="flex h-7 w-7 items-center justify-center rounded border border-glass-border text-muted transition-colors hover:border-muted disabled:opacity-50"
            >
              +
            </button>
          </div>

          {/* Price */}
          <span className="text-sm font-medium text-warm-white">
            {formatPrice(item.lineTotal.amount, item.lineTotal.currency)}
          </span>
        </div>

        {/* Warnings */}
        {!item.available && (
          <p className="mt-1 text-xs text-crimson">Unavailable — cannot checkout</p>
        )}
        {item.available && !item.reserved && (
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs text-original-gold">Stock not reserved</p>
            <button
              onClick={() => refresh()}
              disabled={isLoading}
              className="inline-flex items-center gap-1 text-xs text-original-gold underline transition-colors hover:text-warm-white disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" strokeWidth={1.5} />
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
