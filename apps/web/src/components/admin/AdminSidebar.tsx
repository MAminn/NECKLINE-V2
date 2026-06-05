'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = [
  { href: '/admin/dashboard',  label: 'Dashboard',  icon: '▣' },
  { href: '/admin/products',   label: 'Products',   icon: '◈' },
  { href: '/admin/orders',     label: 'Orders',     icon: '◉' },
  { href: '/admin/customers',  label: 'Customers',  icon: '◎' },
  { href: '/admin/analytics',  label: 'Analytics',  icon: '◌' },
  { href: '/admin/offers',     label: 'Offers',     icon: '◊' },
  { href: '/admin/reports',    label: 'Reports',    icon: '◧' },
  { href: '/admin/reviews',    label: 'Reviews',    icon: '◑' },
  { href: '/admin/interface',  label: 'Interface',  icon: '◲' },
  { href: '/admin/settings',   label: 'Settings',   icon: '◰' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside
      className="flex h-screen w-60 flex-shrink-0 flex-col"
      style={{ background: 'var(--color-admin-bg)', borderRight: '1px solid var(--color-admin-border)' }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-5" style={{ borderBottom: '1px solid var(--color-admin-border)' }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ color: 'var(--color-primary)' }}>
          <path d="M6 0L12 6L6 12L0 6L6 0Z" />
        </svg>
        <span className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-5 py-2.5 text-sm transition-colors duration-150"
              style={{
                color: active ? 'var(--color-text)' : 'var(--color-text-tertiary)',
                background: active ? 'rgba(210,27,39,0.12)' : 'transparent',
                borderLeft: active ? '2px solid var(--color-primary)' : '2px solid transparent',
              }}
            >
              <span className="text-base" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid var(--color-admin-border)' }}>
        <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-gold)' }}>
          {user?.name ?? 'Admin'}
        </p>
        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
          {user?.role}
        </p>
      </div>
    </aside>
  );
}
