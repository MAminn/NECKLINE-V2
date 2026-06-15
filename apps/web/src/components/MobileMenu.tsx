'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu } from 'lucide-react';
import { NAV_LINKS } from './HeaderNav';

function isLinkActive(href: string, pathname: string) {
  if (href === '/') return pathname === '/';
  if (href.startsWith('/#')) return pathname === '/';
  return pathname.startsWith(href);
}

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const overlay = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[60] bg-noir-deep/95 backdrop-blur-xl"
    >
      <div className="flex flex-col h-full p-8">
        <div className="flex justify-end">
          <button
            onClick={() => setOpen(false)}
            className="p-2 text-muted hover:text-warm-white"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          {NAV_LINKS.map((link, i) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 + 0.1 }}
            >
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className={`font-display font-bold text-4xl tracking-[-0.02em] hover:text-crimson transition-colors ${
                  isLinkActive(link.href, pathname) ? 'text-warm-white' : 'text-muted'
                }`}
              >
                {link.label}
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-6">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="font-display font-medium text-sm tracking-[0.1em] text-muted hover:text-warm-white"
          >
            SIGN IN
          </Link>
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="h-10 px-6 bg-crimson text-noir font-display font-semibold text-sm tracking-[0.1em] rounded-full"
          >
            JOIN
          </Link>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-muted hover:text-warm-white transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {mounted && (
        <AnimatePresence>
          {open && createPortal(overlay, document.body)}
        </AnimatePresence>
      )}
    </div>
  );
}
