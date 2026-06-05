import type { CSSProperties } from 'react';

export const adminInput: CSSProperties = {
  background: 'var(--color-surface-input)',
  border: '1px solid var(--color-admin-border)',
  color: 'var(--color-text)',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 13,
  width: '100%',
};

export const adminInputSm: CSSProperties = {
  background: 'var(--color-surface-input)',
  border: '1px solid var(--color-admin-border)',
  color: 'var(--color-text)',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 12,
  width: '100%',
};

export const adminLabel: CSSProperties = {
  color: 'var(--color-gold)',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  display: 'block',
  marginBottom: 4,
};

export const adminCard: CSSProperties = {
  background: 'var(--color-admin-surface)',
  border: '1px solid var(--color-admin-border)',
};

export const adminSearchInput: CSSProperties = {
  background: 'var(--color-surface-input)',
  border: '1px solid var(--color-admin-border)',
  color: 'var(--color-text)',
};
