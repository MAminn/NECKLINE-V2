'use client';

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';

export default function AccountProfile() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await apiClient('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
      setMessage('Profile updated successfully.');
      refreshUser();
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await apiClient('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setMessage('Password changed successfully. Please log in again.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 font-display text-lg uppercase tracking-widest text-text-primary">
          Profile
        </h2>
        <form onSubmit={handleUpdateName} className="space-y-4">
          {message && <div className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-700">{message}</div>}
          {error && <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-text-secondary">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-text-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="mt-1 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-text-secondary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-text-primary px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Update Profile
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-4 font-display text-lg uppercase tracking-widest text-text-primary">
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-text-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-text-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-text-primary px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
