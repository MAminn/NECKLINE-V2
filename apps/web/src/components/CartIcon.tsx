'use client';

import { useCart } from '../hooks/useCart';

export default function CartIcon() {
  const { cart, openDrawer } = useCart();

  return (
    <button
      onClick={openDrawer}
      className="relative p-2 text-text-primary transition-colors hover:text-gold"
      aria-label="Open cart"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {cart.itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-xs font-bold text-bg">
          {cart.itemCount > 99 ? '99+' : cart.itemCount}
        </span>
      )}
    </button>
  );
}
