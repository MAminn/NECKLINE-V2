'use client';

import { useState } from 'react';
import { apiClient } from '../../../../lib/api';
import { useAuth } from '../../../../hooks/useAuth';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  const inputStyle = { background: 'var(--color-surface-input)', border: '1px solid var(--color-admin-border)', color: 'var(--color-text)', borderRadius: 8, padding: '8px 12px', fontSize: 14, width: '100%' } as React.CSSProperties;
  const labelStyle = { color: 'var(--color-gold)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', display: 'block', marginBottom: 6 };
  const sectionStyle = { background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)', borderRadius: 12, padding: 20, maxWidth: 440 } as React.CSSProperties;

  async function handleNameSave(e: React.FormEvent) {
    e.preventDefault();
    setNameSaving(true);
    setNameMsg('');
    try {
      await apiClient('/auth/me', { method: 'PATCH', body: JSON.stringify({ name }) });
      await refreshUser();
      setNameMsg('Name updated.');
    } catch (err) {
      setNameMsg(err instanceof Error ? err.message : 'Failed to update name');
    } finally {
      setNameSaving(false);
    }
  }

  async function handlePwSave(e: React.FormEvent) {
    e.preventDefault();
    setPwSaving(true);
    setPwMsg('');
    try {
      await apiClient('/auth/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) });
      setCurrentPassword('');
      setNewPassword('');
      setPwMsg('Password updated.');
    } catch (err) {
      setPwMsg(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>Profile Settings</h1>

      {/* Name form */}
      <form onSubmit={handleNameSave} style={sectionStyle} className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-gold)' }}>Display Name</h2>
        <div>
          <label style={labelStyle}>Name</label>
          <input required style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {nameMsg && <p className="text-xs" style={{ color: nameMsg.includes('Failed') ? 'var(--color-primary)' : '#4ade80' }}>{nameMsg}</p>}
        <button type="submit" disabled={nameSaving} className="rounded-lg px-6 py-2 text-sm font-bold uppercase tracking-widest" style={{ background: 'var(--color-primary)', color: '#fff', opacity: nameSaving ? 0.6 : 1 }}>
          {nameSaving ? 'Saving…' : 'Save Name'}
        </button>
      </form>

      {/* Password form */}
      <form onSubmit={handlePwSave} style={sectionStyle} className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-gold)' }}>Change Password</h2>
        <div>
          <label style={labelStyle}>Current Password</label>
          <input required type="password" style={inputStyle} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>New Password</label>
          <input required type="password" style={inputStyle} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        {pwMsg && <p className="text-xs" style={{ color: pwMsg.includes('Failed') || pwMsg.includes('incorrect') ? 'var(--color-primary)' : '#4ade80' }}>{pwMsg}</p>}
        <button type="submit" disabled={pwSaving} className="rounded-lg px-6 py-2 text-sm font-bold uppercase tracking-widest" style={{ background: 'var(--color-primary)', color: '#fff', opacity: pwSaving ? 0.6 : 1 }}>
          {pwSaving ? 'Saving…' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
