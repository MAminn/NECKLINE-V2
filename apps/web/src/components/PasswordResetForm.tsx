'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../lib/api';

export default function PasswordResetForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await apiClient('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage('If an account exists, a reset link has been sent to your inbox.');
    } catch (err: any) {
      setError(err.message || 'Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {message && (
        <div className="alert-success flex items-start gap-2.5">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="alert-error flex items-start gap-2.5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="reset-email" className="field-label">Email Address</label>
        <input
          id="reset-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input-field"
          autoComplete="email"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-sm bg-primary py-3 text-sm font-semibold uppercase tracking-widest text-white transition-all duration-200 hover:bg-primary-hover hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Send Reset Link'}
      </button>
    </form>
  );
}
