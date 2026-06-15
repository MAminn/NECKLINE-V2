'use client';

import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface AdminSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
  id?: string;
}

export default function AdminSelect({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  size = 'md',
  id,
}: AdminSelectProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'admin-select w-full appearance-none rounded-lg border border-[var(--color-admin-border)]',
          'bg-[var(--color-surface-input)] text-[var(--color-text)]',
          'transition-colors duration-200',
          'focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--crimson-glow)]',
          size === 'sm' ? 'px-2.5 py-1.5 pr-8 text-xs' : 'px-3 py-2 pr-9 text-sm',
        ].join(' ')}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={size === 'sm' ? 12 : 14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--color-text-tertiary)' }}
      />
    </div>
  );
}
