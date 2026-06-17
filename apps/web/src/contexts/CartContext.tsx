'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient, generateCorrelationId } from '../lib/api';
import { LOCAL_PRODUCTS } from '../data/products';
import { DEFAULT_CURRENCY } from '../lib/constants';

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

const emptyCart: Cart = {
  cartId: null,
  items: [],
  itemCount: 0,
  subtotal: null,
  discount: null,
  shipping: null,
  total: null,
  appliedPromoCode: null,
};

function getLocalProduct(productId: string) {
  return LOCAL_PRODUCTS.find((p) => p.id === productId);
}

function buildGuestItem(productId: string, quantity: number): CartItem | null {
  const product = getLocalProduct(productId);
  if (!product) return null;
  return {
    productId: product.id,
    name: product.name,
    sku: product.id.toUpperCase(),
    image: product.image,
    quantity,
    unitPrice: { amount: product.price, currency: product.currency },
    lineTotal: { amount: product.price * quantity, currency: product.currency },
    available: true,
    reserved: true,
  };
}

function mergeCarts(serverCart: Cart, guestItems: CartItem[]): Cart {
  const itemMap = new Map<string, CartItem>();

  for (const item of serverCart.items) {
    itemMap.set(item.productId, { ...item });
  }

  for (const guest of guestItems) {
    const existing = itemMap.get(guest.productId);
    if (existing) {
      const quantity = existing.quantity + guest.quantity;
      itemMap.set(guest.productId, {
        ...existing,
        quantity,
        lineTotal: {
          amount: existing.unitPrice.amount * quantity,
          currency: existing.unitPrice.currency,
        },
      });
    } else {
      itemMap.set(guest.productId, { ...guest });
    }
  }

  const items = Array.from(itemMap.values());
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const currency = items[0]?.unitPrice.currency || serverCart.subtotal?.currency || DEFAULT_CURRENCY;
  const subtotalAmount = items.reduce((sum, i) => sum + i.lineTotal.amount, 0);

  // When we have guest items, totals are based on subtotal only (no server-side shipping/discount).
  const totalAmount = serverCart.total && serverCart.items.length > 0
    ? serverCart.total.amount + subtotalAmount - (serverCart.subtotal?.amount || 0)
    : subtotalAmount;

  return {
    ...serverCart,
    items,
    itemCount,
    subtotal: { amount: subtotalAmount, currency },
    total: { amount: totalAmount, currency },
  };
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [serverCart, setServerCart] = useState<Cart>(emptyCart);
  const [guestItems, setGuestItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const cart = useMemo(() => mergeCarts(serverCart, guestItems), [serverCart, guestItems]);

  const fetchCart = useCallback(async () => {
    try {
      const data = await apiClient('/cart');
      setServerCart(data);
    } catch {
      setServerCart(emptyCart);
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
        setServerCart(data);
      } catch (err) {
        // Fallback: add to local guest cart so the UI always responds
        const guest = buildGuestItem(productId, quantity);
        if (guest) {
          setGuestItems((prev) => {
            const existing = prev.find((i) => i.productId === productId);
            if (existing) {
              return prev.map((i) =>
                i.productId === productId
                  ? {
                      ...i,
                      quantity: i.quantity + quantity,
                      lineTotal: {
                        amount: i.unitPrice.amount * (i.quantity + quantity),
                        currency: i.unitPrice.currency,
                      },
                    }
                  : i
              );
            }
            return [...prev, guest];
          });
        } else {
          throw err;
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const isGuest = guestItems.some((i) => i.productId === productId);
      if (isGuest) {
        if (quantity <= 0) {
          setGuestItems((prev) => prev.filter((i) => i.productId !== productId));
          return;
        }
        setGuestItems((prev) =>
          prev.map((i) =>
            i.productId === productId
              ? {
                  ...i,
                  quantity,
                  lineTotal: { amount: i.unitPrice.amount * quantity, currency: i.unitPrice.currency },
                }
              : i
          )
        );
        return;
      }

      setIsLoading(true);
      try {
        const data = await apiClient(`/cart/items/${productId}`, {
          method: 'PATCH',
          body: JSON.stringify({ quantity }),
        });
        setServerCart(data);
      } finally {
        setIsLoading(false);
      }
    },
    [guestItems]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      const isGuest = guestItems.some((i) => i.productId === productId);
      if (isGuest) {
        setGuestItems((prev) => prev.filter((i) => i.productId !== productId));
        return;
      }

      setIsLoading(true);
      try {
        const data = await apiClient(`/cart/items/${productId}`, {
          method: 'DELETE',
        });
        setServerCart(data);
      } finally {
        setIsLoading(false);
      }
    },
    [guestItems]
  );

  const clearCart = useCallback(async () => {
    setGuestItems([]);
    setIsLoading(true);
    try {
      const data = await apiClient('/cart', { method: 'DELETE' });
      setServerCart(data);
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
      setServerCart(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removePromoCode = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient('/cart/promo', { method: 'DELETE' });
      setServerCart(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient('/cart/refresh', { method: 'POST' });
      setServerCart(data);
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
