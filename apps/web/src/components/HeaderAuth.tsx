'use client';

import Link from 'next/link';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function HeaderAuth() {
  const { user, isAuthenticated, logout } = useAuth();

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-4">
        {user.role === 'admin' && (
          <Link
            href="/admin"
            className="hidden md:block font-display font-medium text-xs tracking-[0.1em] text-muted hover:text-warm-white transition-colors duration-200"
          >
            DASHBOARD
          </Link>
        )}
        <Link
          href="/account"
          className="flex items-center gap-1.5 font-display font-medium text-xs tracking-[0.1em] text-muted hover:text-warm-white transition-colors duration-200"
        >
          <User className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">{user.name}</span>
        </Link>
        <button
          onClick={() => logout()}
          className="flex items-center gap-1 font-display font-medium text-xs tracking-[0.1em] text-muted hover:text-warm-white transition-colors duration-200"
          aria-label="Log out"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">OUT</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="hidden md:block font-display font-medium text-xs tracking-[0.1em] text-muted hover:text-warm-white transition-colors duration-200"
      >
        SIGN IN
      </Link>
      <Link
        href="/register"
        className="inline-flex items-center justify-center h-9 px-5 bg-crimson text-noir font-display font-semibold text-xs tracking-[0.1em] rounded-full hover:bg-crimson-light transition-colors duration-200"
      >
        JOIN
      </Link>
    </div>
  );
}
