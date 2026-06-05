'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiClient, generateCorrelationId } from '../lib/api';

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  image: string | null;
  quantity: number;
  unitPrice: { amount: number; currency: string };
  lineTotal: { amount: number; currency: string };
  available: boolean;
  reserved: boolean;
}

export interface CartDiscount {
  code: string | null;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  amount: number;
  currency: string;
}

export interface Cart {
  cartId: string | null;
  items: CartItem[];
  itemCount: number;
  subtotal: { amount: number; currency: string } | null;
  discount: CartDiscount | null;
  shipping: { amount: number; currency: string } | null;
  total: { amount: number; currency: string } | null;
  appliedPromoCode: string | null;
}

interface CartContextValue {
  cart: Cart;
  isLoading: boolean;
  isOpen: boolean;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyPromoCode: (code: string) => Promise<void>;
  removePromoCode: () => Promise<void>;
  refresh: () => Promise<void>;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const emptyCart: Cart = { cartId: null, items: [], itemCount: 0, subtotal: null, discount: null, shipping: null, total: null, appliedPromoCode: null };

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const data = await apiClient('/cart');
      setCart(data);
    } catch {
      setCart(emptyCart);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = useCallback(
    async (productId: string, quantity: number) => {
      setIsLoading(true);
      try {
        const data = await apiClient('/cart/items', {
          method: 'POST',
          body: JSON.stringify({ productId, quantity }),
          idempotencyKey: `add-${productId}-${generateCorrelationId()}`,
        });
        setCart(data);
        setIsOpen(true);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      setIsLoading(true);
      try {
        const data = await apiClient(`/cart/items/${productId}`, {
          method: 'PATCH',
          body: JSON.stringify({ quantity }),
        });
        setCart(data);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const removeItem = useCallback(
    async (productId: string) => {
      setIsLoading(true);
      try {
        const data = await apiClient(`/cart/items/${productId}`, {
          method: 'DELETE',
        });
        setCart(data);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient('/cart', { method: 'DELETE' });
      setCart(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyPromoCode = useCallback(async (code: string) => {
    setIsLoading(true);
    try {
      const data = await apiClient('/cart/apply-promo', {
        method: 'POST',
        body: JSON.stringify({ code }),
        idempotencyKey: `promo-${code}-${generateCorrelationId()}`,
      });
      setCart(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removePromoCode = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient('/cart/promo', { method: 'DELETE' });
      setCart(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient('/cart/refresh', { method: 'POST' });
      setCart(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isOpen,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyPromoCode,
        removePromoCode,
        refresh,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartContext must be used within CartProvider');
  return ctx;
}
