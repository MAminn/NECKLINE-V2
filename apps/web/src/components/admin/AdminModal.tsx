'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function AdminModal({ open, title, onClose, children }: AdminModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.7)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-lg rounded-xl shadow-2xl"
            style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--admin-border)' }}
            >
              <h2 className="text-base font-semibold tracking-wide" style={{ color: 'var(--admin-text)' }}>
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-lg leading-none transition-colors duration-150"
                style={{ color: 'var(--admin-text-muted)' }}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            {/* Body */}
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
