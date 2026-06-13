'use client';

import { User, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function HeaderAuth() {
  const { user, isAuthenticated, logout } = useAuth();

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-4">
        {user.role === 'admin' && (
          <a
            href="/admin"
            className="text-xs uppercase tracking-[0.16em] text-gold transition-all duration-200 pb-[2px] border-b border-gold/50 hover:border-gold"
          >
            Dashboard
          </a>
        )}
        <a
          href="/account"
          className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-text-secondary transition-colors hover:text-text-primary"
        >
          <User className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>{user.name}</span>
        </a>
        <button
          onClick={() => logout()}
          className="flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-text-muted transition-colors hover:text-text-secondary"
          aria-label="Log out"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden lg:inline">Out</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <a
        href="/login"
        className="text-xs uppercase tracking-[0.16em] text-text-secondary transition-all duration-200 hover:text-gold pb-[2px] border-b border-transparent hover:border-gold/50"
      >
        Sign In
      </a>
      <a
        href="/register"
        className="inline-flex items-center px-4 py-[7px] text-xs font-semibold uppercase tracking-[0.16em] bg-gold text-text-inverse transition-all duration-200 hover:brightness-90"
      >
        Join
      </a>
    </div>
  );
}
