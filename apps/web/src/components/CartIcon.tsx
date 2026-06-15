'use client';

import { ShoppingBag } from 'lucide-react';
import { useCart } from '../hooks/useCart';

export default function CartIcon() {
  const { cart, openDrawer } = useCart();

  return (
    <button
      onClick={openDrawer}
      className="relative p-2 text-muted hover:text-warm-white transition-colors duration-200"
      aria-label="Open cart"
    >
      <ShoppingBag size={20} />
      {cart.itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-crimson rounded-full text-[10px] font-mono text-warm-white flex items-center justify-center">
          {cart.itemCount > 99 ? '99+' : cart.itemCount}
        </span>
      )}
    </button>
  );
}
