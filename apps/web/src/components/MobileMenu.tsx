'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Menu, ArrowRight } from 'lucide-react';
import HeaderAuth from './HeaderAuth';

const links = [
  { href: '/shop', label: 'Shop' },
  { href: '/#collection', label: 'Collection' },
  { href: '/#how-to-apply', label: 'Ritual' },
  { href: '/#reviews', label: 'Reviews' },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" strokeWidth={1.5} />
      </button>

      {/* Full-screen overlay */}
      <div
        className={`fixed inset-0 z-[1150] flex flex-col transition-all duration-500
          ${open
            ? 'opacity-100 pointer-events-auto translate-y-0'
            : 'opacity-0 pointer-events-none -translate-y-2'
          }`}
        style={{ background: '#070606' }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2"
            aria-label="Neckline home"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" className="text-primary">
              <path d="M6 0L12 6L6 12L0 6L6 0Z" />
            </svg>
            <span className="font-display text-lg uppercase tracking-[0.15em] text-white">NECKLINE</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="p-2 text-text-muted hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col flex-1 px-8 pt-6">
          {links.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="group flex items-center justify-between border-b border-white/[0.05] py-5 font-display font-medium uppercase tracking-[0.08em] text-white/75 hover:text-[#C29F68] transition-colors duration-200"
              style={{
                fontSize: 'clamp(26px, 7vw, 38px)',
                transitionDelay: open ? `${80 + i * 40}ms` : '0ms',
              }}
            >
              {link.label}
              <ArrowRight
                className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-[#C29F68]"
                strokeWidth={1.5}
              />
            </a>
          ))}
        </nav>

        {/* Auth at bottom */}
        <div className="px-8 py-6 border-t border-white/[0.06] shrink-0">
          <HeaderAuth />
        </div>
      </div>
    </div>
  );
}
