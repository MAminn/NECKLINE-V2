'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../lib/api';

export default function PasswordResetConfirmForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await apiClient('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: password }),
      });
      setMessage('Password updated successfully. Redirecting to login...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-text-secondary">New Password</label>
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
        {loading ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
}
