'use client';

import { useAuth } from '../hooks/useAuth';

export default function HeaderAuth() {
  const { user, isAuthenticated, logout } = useAuth();

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <a
          href="/account"
          className="text-sm uppercase tracking-wide text-text-secondary transition-colors hover:text-text-primary"
        >
          {user.name}
        </a>
        <button
          onClick={() => logout()}
          className="text-sm uppercase tracking-wide text-text-secondary transition-colors hover:text-text-primary"
        >
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <a
        href="/login"
        className="text-sm uppercase tracking-wide text-text-secondary transition-colors hover:text-text-primary"
      >
        Log In
      </a>
      <a
        href="/register"
        className="text-sm uppercase tracking-wide text-text-secondary transition-colors hover:text-text-primary"
      >
        Sign Up
      </a>
    </div>
  );
}
