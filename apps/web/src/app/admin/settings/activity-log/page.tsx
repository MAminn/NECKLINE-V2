'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAdminActivityLog } from '../../../../lib/admin-api';
import type { AuditEventRecord } from '../../../../types/nickline';

export default function ActivityLogPage() {
  const [events, setEvents] = useState<AuditEventRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getAdminActivityLog({ page, limit: 50 })
      .then((d) => { setEvents(d.events); setTotal(d.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--admin-text)' }}>Activity Log</h1>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--admin-border)' }}>
        <table className="w-full text-xs">
          <thead style={{ background: 'var(--admin-surface)' }}>
            <tr>
              {['Actor', 'Action', 'Target', 'Changes', 'Timestamp'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: 'var(--admin-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="py-8 text-center" style={{ color: 'var(--admin-text-muted)' }}>Loading…</td></tr>}
            {!loading && events.map((e) => (
              <tr key={e.id} style={{ borderTop: '1px solid var(--admin-border)' }}>
                <td className="px-3 py-2 truncate max-w-[120px]" style={{ color: 'var(--admin-text)' }}>{e.actor}</td>
                <td className="px-3 py-2 font-mono" style={{ color: 'var(--admin-gold)' }}>{e.action}</td>
                <td className="px-3 py-2 font-mono truncate max-w-[80px]" style={{ color: 'var(--admin-text-muted)' }}>{e.targetType}·{e.target.slice(-6)}</td>
                <td className="px-3 py-2 max-w-[200px]">
                  {(e.before || e.after) && (
                    <details className="cursor-pointer">
                      <summary className="text-[10px]" style={{ color: 'var(--admin-text-muted)' }}>View diff</summary>
                      <pre className="mt-1 text-[9px] overflow-x-auto" style={{ color: 'var(--admin-text)' }}>
                        {JSON.stringify({ before: e.before, after: e.after }, null, 2)}
                      </pre>
                    </details>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--admin-text-muted)' }}>
                  {new Date(e.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
            {!loading && !events.length && <tr><td colSpan={5} className="py-8 text-center" style={{ color: 'var(--admin-text-muted)' }}>No activity yet</td></tr>}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ color: 'var(--admin-text-muted)' }}>← Prev</button>
          <span style={{ color: 'var(--admin-text)' }}>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ color: 'var(--admin-text-muted)' }}>Next →</button>
        </div>
      )}
    </div>
  );
}
