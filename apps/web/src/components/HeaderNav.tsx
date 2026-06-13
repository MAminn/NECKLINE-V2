'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/#how-to-apply', label: 'Ritual' },
  { href: '/#reviews', label: 'Reviews' },
];

function isLinkActive(href: string, pathname: string) {
  if (href === '/') return pathname === '/';
  if (href.startsWith('/#')) return false;
  return pathname.startsWith(href);
}

export default function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-1 lg:gap-2">
      {NAV_LINKS.map((link) => {
        const active = isLinkActive(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative px-3 lg:px-4 py-2 rounded-full text-xs uppercase tracking-[0.18em] font-semibold transition-colors duration-200 ${
              active
                ? 'text-text-primary bg-white/[0.06]'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
            }`}
          >
            {link.label}
            {active && (
              <span className="absolute left-1/2 bottom-1 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" aria-hidden="true" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
