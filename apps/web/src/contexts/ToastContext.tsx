'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'brand';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  sub?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, options?: { type?: ToastType; duration?: number; sub?: string }) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, options: { type?: ToastType; duration?: number; sub?: string } = {}) => {
      const { type = 'brand', duration = 3500, sub } = options;
      const id = Math.random().toString(36).slice(2, 9);
      setToasts(prev => [...prev, { id, message, type, sub }]);
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
