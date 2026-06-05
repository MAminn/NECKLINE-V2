'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
        <label htmlFor="reg-name" className="field-label">Full Name</label>
        <input
          id="reg-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="input-field"
          autoComplete="name"
        />
      </div>

      <div>
        <label htmlFor="reg-email" className="field-label">Email</label>
        <input
          id="reg-email"
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
        <label htmlFor="reg-password" className="field-label">Password</label>
        <input
          id="reg-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="input-field"
          autoComplete="new-password"
        />
        <p className="mt-1.5 text-xs text-text-muted">
          Min 8 characters — uppercase, lowercase, and a number.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-sm bg-primary py-3 text-sm font-semibold uppercase tracking-widest text-white transition-all duration-200 hover:bg-primary-hover hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Creating Account…' : 'Create Account'}
      </button>
    </form>
  );
}
