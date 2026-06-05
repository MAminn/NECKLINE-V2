'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="alert-error flex items-start gap-2.5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="login-email" className="field-label">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input-field"
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="login-password" className="field-label">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="input-field"
          autoComplete="current-password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-sm bg-primary py-3 text-sm font-semibold uppercase tracking-widest text-white transition-all duration-200 hover:bg-primary-hover hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
