'use client';

import { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, AlertCircle, Info, ShoppingBag } from 'lucide-react';
import { Toast, ToastType } from '../contexts/ToastContext';

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

const typeConfig: Record<ToastType, { icon: React.ReactNode; accent: string }> = {
  brand: {
    icon: <ShoppingBag className="w-4 h-4 text-crimson shrink-0" strokeWidth={1.5} />,
    accent: 'border-l-crimson',
  },
  success: {
    icon: <CheckCircle2 className="w-4 h-4 text-success shrink-0" strokeWidth={1.5} />,
    accent: 'border-l-success',
  },
  error: {
    icon: <AlertCircle className="w-4 h-4 text-crimson shrink-0" strokeWidth={1.5} />,
    accent: 'border-l-crimson',
  },
  info: {
    icon: <Info className="w-4 h-4 text-muted shrink-0" strokeWidth={1.5} />,
    accent: 'border-l-muted',
  },
};

export default function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { icon, accent } = typeConfig[toast.type];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 250);
    }, 3300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  return (
    <div
      className={`pointer-events-auto max-w-sm w-full transform-gpu transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-[0.96]'}`}
    >
      <div
        className={`glass-card-strong rounded-lg border-l-4 ${accent} p-4 shadow-modal flex items-start justify-between gap-3`}
      >
        <div className="flex items-start gap-3 min-w-0">
          <span className="mt-0.5">{icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-display font-medium tracking-wide text-warm-white leading-snug">
              {toast.message}
            </p>
            {toast.sub && (
              <p className="text-xs text-muted mt-1 leading-snug truncate">{toast.sub}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onDismiss, 250);
          }}
          className="text-muted hover:text-warm-white transition-colors shrink-0 mt-0.5"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
