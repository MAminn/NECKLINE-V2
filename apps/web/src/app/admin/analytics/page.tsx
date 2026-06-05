'use client';

import { useEffect, useState } from 'react';
import { getMetrics } from '../../../lib/admin-api';
import type { AdminMetrics } from '../../../types/nickline';
import AnalyticsChart from '../../../components/admin/analytics/AnalyticsChart';
import AdminKpiCard from '../../../components/admin/AdminKpiCard';

const TIMEFRAMES = ['7D', '30D', 'ALL'] as const;
type Timeframe = typeof TIMEFRAMES[number];

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('30D');

  useEffect(() => {
    getMetrics().then(setMetrics).catch(() => {});
  }, []);

  const history = metrics?.visitsHistory ?? [];
  const filtered = timeframe === '7D' ? history.slice(-7) : timeframe === '30D' ? history.slice(-30) : history;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>Analytics</h1>

      {/* Timeframe selector */}
      <div className="flex gap-2">
        {TIMEFRAMES.map((t) => (
          <button
            key={t}
            onClick={() => setTimeframe(t)}
            className="rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
            style={{
              background: timeframe === t ? 'var(--color-primary)' : 'transparent',
              color: timeframe === t ? '#fff' : 'var(--color-text-tertiary)',
              border: '1px solid var(--color-admin-border)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <AnalyticsChart data={filtered} />

      {/* KPI cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <AdminKpiCard label="Conversion Rate" value={`${(metrics.conversionRate * 100).toFixed(1)}%`} />
          <AdminKpiCard label="Returning Rate" value={`${(metrics.returningRate * 100).toFixed(1)}%`} />
          <AdminKpiCard label="Avg Order Value" value={`${(metrics.averageOrderValue / 100).toLocaleString()} EGP`} />
          <AdminKpiCard label="New Customers (7d)" value={metrics.newCustomers} trend="up" />
        </div>
      )}
    </div>
  );
}
