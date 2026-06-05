'use client';

import { useState } from 'react';

interface PromoCodeInputProps {
  appliedCode?: string | null;
  onApply: (code: string) => void;
  onRemove: () => void;
  isLoading?: boolean;
}

export default function PromoCodeInput({ appliedCode, onApply, onRemove, isLoading }: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!code.trim()) return;
    try {
      await onApply(code.trim());
      setCode('');
    } catch (err: any) {
      setError(err.message || 'Invalid promo code');
    }
  }

  if (appliedCode) {
    return (
      <div className="rounded-lg bg-surface-alt p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Promo Code Applied</p>
            <p className="font-display text-gold">{appliedCode}</p>
          </div>
          <button
            onClick={onRemove}
            disabled={isLoading}
            className="text-sm text-text-secondary underline hover:text-primary disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-surface-alt p-4">
      <p className="text-sm font-medium">Have a promo code?</p>
      <form onSubmit={handleApply} className="mt-2 flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter code"
          className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-gold focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !code.trim()}
          className="rounded-md border border-border bg-bg px-4 py-2 text-sm font-medium uppercase tracking-wide text-text-primary transition-colors hover:bg-surface-alt disabled:opacity-50"
        >
          Apply
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-primary">{error}</p>}
    </div>
  );
}
