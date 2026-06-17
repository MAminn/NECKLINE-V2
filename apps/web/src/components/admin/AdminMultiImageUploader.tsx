'use client';

import { useState, useRef } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { getCsrfToken, invalidateCsrfToken } from '../../lib/csrf';
import { refreshAccessToken } from '../../lib/api';

interface AdminMultiImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  label?: string;
}

export default function AdminMultiImageUploader({
  images,
  onChange,
  label = 'Product Images',
}: AdminMultiImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const uploadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/admin/uploads`;
    const doUpload = async (csrfToken: string | null) =>
      fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
      });
    let res = await doUpload(await getCsrfToken());
    // Expired access token (15 min): refresh once and retry, mirroring api.ts
    if (res.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) res = await doUpload(await getCsrfToken());
    }
    if (res.status === 403) {
      invalidateCsrfToken();
      const csrfToken = await getCsrfToken();
      if (csrfToken) res = await doUpload(csrfToken);
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Upload failed');
    }
    const data = await res.json();
    return data.url;
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError('');
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(uploadFile));
      onChange([...images, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-gold)' }}>
        {label}
      </label>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm transition-colors"
        style={{
          borderColor: 'var(--color-admin-border-strong)',
          color: 'var(--color-text-tertiary)',
          background: 'var(--color-surface-input)',
          opacity: uploading ? 0.6 : 1,
        }}
      >
        <Upload size={18} />
        {uploading ? 'Uploading…' : 'Click to upload images'}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {error && <p className="text-xs text-red-400">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-lg"
              style={{ border: '1px solid var(--color-admin-border)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`Remove image ${index + 1}`}
              >
                <X size={14} />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                  style={{ background: 'var(--color-primary)', color: '#fff' }}>
                  Hero
                </span>
              )}
            </div>
          ))}
          {images.length === 0 && (
            <div className="flex aspect-square items-center justify-center rounded-lg" style={{ background: 'var(--color-surface-input)' }}>
              <ImageIcon size={24} style={{ color: 'var(--color-text-muted)' }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
