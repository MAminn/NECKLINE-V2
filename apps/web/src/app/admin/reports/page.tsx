'use client';

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>Reports</h1>
      <div
        className="rounded-xl p-8 text-center"
        style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}
      >
        <p className="text-2xl mb-2" style={{ color: 'var(--color-text-tertiary)' }}>◧</p>
        <p className="text-base font-bold" style={{ color: 'var(--color-text)' }}>Reports — Coming Soon</p>
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
          Export functionality ships in Phase 6b.
        </p>
      </div>
    </div>
  );
}
