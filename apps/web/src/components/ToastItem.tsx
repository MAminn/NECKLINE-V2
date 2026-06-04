'use client';

import { useState, useEffect, useRef } from 'react';
import { Heart, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Toast, ToastType } from '../contexts/ToastContext';

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

const typeConfig: Record<ToastType, { icon: React.ReactNode; border: string; bg: string }> = {
  brand: {
    icon: <Heart className="w-3.5 h-3.5 text-[#D21B27] fill-[#D21B27] shrink-0" />,
    border: 'border-[#D21B27]/30',
    bg: 'bg-neutral-950',
  },
  success: {
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] shrink-0" strokeWidth={1.5} />,
    border: 'border-[#22C55E]/25',
    bg: 'bg-[#080f08]',
  },
  error: {
    icon: <AlertCircle className="w-3.5 h-3.5 text-[#EF4444] shrink-0" strokeWidth={1.5} />,
    border: 'border-[#EF4444]/25',
    bg: 'bg-[#0f0808]',
  },
  info: {
    icon: <Info className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" strokeWidth={1.5} />,
    border: 'border-[#3B82F6]/25',
    bg: 'bg-[#080a0f]',
  },
};

export default function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { icon, border, bg } = typeConfig[toast.type];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 200);
    }, 3300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [onDismiss]);

  return (
    <div
      className={`${bg} border ${border} text-white px-4 py-3 flex items-start justify-between gap-3
        shadow-2xl rounded pointer-events-auto transition-all duration-200
        ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <span className="mt-0.5">{icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-white leading-snug">
            {toast.message}
          </p>
          {toast.sub && (
            <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug truncate">
              {toast.sub}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(onDismiss, 200); }}
        className="text-neutral-500 hover:text-white transition-colors shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}
