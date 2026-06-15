'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export const NAV_LINKS = [
  { label: 'HOME', href: '/' },
  { label: 'SHOP', href: '/shop' },
  { label: 'RITUAL', href: '/#ritual' },
  { label: 'REVIEWS', href: '/#reviews' },
];

function isLinkActive(href: string, pathname: string) {
  if (href === '/') return pathname === '/';
  if (href.startsWith('/#')) return pathname === '/';
  return pathname.startsWith(href);
}

export default function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-8">
      {NAV_LINKS.map((link) => {
        const active = isLinkActive(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative font-display font-medium text-xs tracking-[0.1em] transition-colors duration-200 ${
              active ? 'text-warm-white' : 'text-muted hover:text-warm-white'
            }`}
          >
            {link.label}
            {active && (
              <motion.span
                layoutId="nav-indicator"
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-crimson"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
