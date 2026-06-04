'use client';

import { useEffect, useState } from 'react';
import AdminKpiCard from '../AdminKpiCard';
import { getMetrics } from '../../../lib/admin-api';
import type { AdminMetrics } from '../../../types/nickline';

function fmtEGP(n: number) { return `${(n / 100).toLocaleString()} EGP`; }
function fmtPct(n: number) { return `${(n * 100).toFixed(1)}%`; }

export default function DashboardKpis() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMetrics()
      .then(setMetrics)
      .catch(() => setError('Failed to load metrics'));
  }, []);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!metrics) return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: 'var(--admin-surface)' }} />
      ))}
    </div>
  );

  const history = metrics.visitsHistory.map((v) => v.checkouts);

  const kpis = [
    { label: 'Revenue Today', value: fmtEGP(metrics.revenueToday), trend: 'up' as const, history },
    { label: 'Total Revenue', value: fmtEGP(metrics.totalRevenue), trend: 'up' as const, history },
    { label: 'Orders Today', value: metrics.todayOrdersCount, trend: 'up' as const, history },
    { label: 'Total Orders', value: metrics.ordersCount, trend: 'neutral' as const, history },
    { label: 'Avg Order', value: fmtEGP(metrics.averageOrderValue), trend: 'neutral' as const, history },
    { label: 'Conversion', value: fmtPct(metrics.conversionRate), trend: 'neutral' as const },
    { label: 'Returning', value: fmtPct(metrics.returningRate), trend: 'up' as const },
    { label: 'New Customers', value: metrics.newCustomers, trend: 'up' as const },
    { label: 'Pending', value: metrics.pendingCount, trend: metrics.pendingCount > 5 ? 'down' as const : 'neutral' as const },
    { label: 'Processing', value: metrics.processingCount, trend: 'neutral' as const },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {kpis.map((k) => (
        <AdminKpiCard key={k.label} label={k.label} value={k.value} trend={k.trend} history={k.history} />
      ))}
    </div>
  );
}
