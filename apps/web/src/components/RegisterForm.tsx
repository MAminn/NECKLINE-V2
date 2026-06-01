'use client';

import { useState } from 'react';
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
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-text-secondary">Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-text-primary focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-text-primary focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-text-primary focus:outline-none"
        />
        <p className="mt-1 text-xs text-text-secondary">
          At least 8 characters, one uppercase, one lowercase, one number.
        </p>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-text-primary px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
}
