'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import HeaderAuth from './HeaderAuth';

const links = [
  { href: '/shop', label: 'Shop' },
  { href: '/#collection', label: 'Collection' },
  { href: '/#how-to-apply', label: 'Ritual' },
  { href: '/#reviews', label: 'Reviews' },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Toggle menu"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 bg-bg/95 backdrop-blur-xl border-b border-border animate-fade-in">
          <nav className="flex flex-col px-6 py-4 gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-3 text-base uppercase tracking-[0.12em] text-text-secondary hover:text-text-primary transition-colors font-medium border-b border-border/50 last:border-0"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 sm:hidden">
              <HeaderAuth />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
