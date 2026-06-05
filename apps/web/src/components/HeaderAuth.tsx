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
            className="text-[10px] uppercase tracking-[0.16em] transition-all duration-200 pb-[2px] border-b border-[#C29F68]/50 hover:border-[#C29F68]"
            style={{ color: '#C29F68' }}
          >
            Dashboard
          </a>
        )}
        <a
          href="/account"
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-text-secondary transition-colors hover:text-text-primary"
        >
          <User className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>{user.name}</span>
        </a>
        <button
          onClick={() => logout()}
          className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-text-muted transition-colors hover:text-text-secondary"
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
        className="text-[10px] uppercase tracking-[0.16em] text-text-secondary transition-all duration-200 hover:text-[#C29F68] pb-[2px] border-b border-transparent hover:border-[#C29F68]/50"
      >
        Sign In
      </a>
      <a
        href="/register"
        className="inline-flex items-center px-4 py-[7px] text-[10px] font-semibold uppercase tracking-[0.16em] transition-all duration-200 hover:brightness-90"
        style={{ background: '#C29F68', color: '#070606' }}
      >
        Join
      </a>
    </div>
  );
}
