'use client';

import { User, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function HeaderAuth() {
  const { user, isAuthenticated, logout } = useAuth();

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <a
          href="/account"
          className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-text-secondary transition-colors hover:text-text-primary"
        >
          <User className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>{user.name}</span>
        </a>
        <button
          onClick={() => logout()}
          className="flex items-center gap-1 text-xs uppercase tracking-widest text-text-muted transition-colors hover:text-text-secondary"
          aria-label="Log out"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden lg:inline">Log Out</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <a
        href="/login"
        className="text-xs uppercase tracking-widest text-text-secondary transition-colors hover:text-text-primary"
      >
        Log In
      </a>
      <a
        href="/register"
        className="inline-flex items-center rounded-sm border border-primary/60 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary transition-all duration-200 hover:bg-primary hover:text-white hover:shadow-glow"
      >
        Sign Up
      </a>
    </div>
  );
}
