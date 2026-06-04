'use client';

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--admin-text)' }}>Reports</h1>
      <div
        className="rounded-xl p-8 text-center"
        style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
      >
        <p className="text-2xl mb-2" style={{ color: 'var(--admin-text-muted)' }}>◧</p>
        <p className="text-base font-bold" style={{ color: 'var(--admin-text)' }}>Reports — Coming Soon</p>
        <p className="text-sm mt-2" style={{ color: 'var(--admin-text-muted)' }}>
          Export functionality ships in Phase 6b.
        </p>
      </div>
    </div>
  );
}
