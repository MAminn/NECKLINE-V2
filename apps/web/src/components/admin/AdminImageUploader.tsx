'use client';

import { useState, useRef } from 'react';
import { uploadAdminImage } from '../../lib/admin-api';

interface AdminImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function AdminImageUploader({ value, onChange, label = 'Image URL' }: AdminImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      onChange(await uploadAdminImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-gold)' }}>
        {label}
      </label>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://..."
        className="w-full rounded-lg px-3 py-2 text-sm"
        style={{
          background: 'var(--color-surface-input)',
          border: '1px solid var(--color-admin-border)',
          color: 'var(--color-text)',
        }}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150"
          style={{
            background: 'rgba(210,27,39,0.15)',
            color: 'var(--color-primary)',
            border: '1px solid var(--color-primary)',
            opacity: uploading ? 0.5 : 1,
          }}
        >
          {uploading ? 'Uploading…' : 'Upload file'}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="Preview" className="h-20 w-32 rounded-lg object-cover" style={{ border: '1px solid var(--color-admin-border)' }} />
      )}
    </div>
  );
}
