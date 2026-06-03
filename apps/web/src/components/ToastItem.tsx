'use client';

import { useState, useEffect, useRef } from 'react';
import { Heart, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  sub: string;
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

export default function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 200);
    }, 3300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  return (
    <div
      className={`bg-neutral-950 border border-[#D21B27]/30 text-white p-4 flex items-center justify-between gap-4 shadow-2xl rounded-none pointer-events-auto transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
      }`}
    >
      <div className="text-left">
        <div className="flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-[#D21B27] fill-[#D21B27]" />
          <span className="text-xs font-serif font-bold tracking-wider uppercase">
            {toast.message}
          </span>
        </div>
        <p className="text-[10px] text-neutral-400 font-light mt-0.5">{toast.sub}</p>
      </div>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onDismiss, 200);
        }}
        className="text-neutral-500 hover:text-white p-0.5 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
