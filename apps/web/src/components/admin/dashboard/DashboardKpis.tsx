'use client';

import AdminKpiCard from '../AdminKpiCard';
import type { AdminMetrics } from '../../../types/nickline';
import { adminCard } from '../adminStyles';
import { formatPrice } from '../../../lib/formatPrice';
import { DEFAULT_CURRENCY } from '../../../lib/constants';

const SKELETON_STYLE = { ...adminCard, height: 112, borderRadius: 12 } as const;

function fmtEGP(n: number) { return formatPrice(n, DEFAULT_CURRENCY); }
function fmtPct(n: number) { return `${(n * 100).toFixed(1)}%`; }

interface Props { metrics: AdminMetrics | null; }

export default function DashboardKpis({ metrics }: Props) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="animate-pulse" style={SKELETON_STYLE} />
        ))}
      </div>
    );
  }

  const history = metrics.visitsHistory.map((v) => v.checkouts);

  const kpis = [
    { label: 'Revenue Today',  value: fmtEGP(metrics.revenueToday),       trend: 'up'      as const, history },
    { label: 'Total Revenue',  value: fmtEGP(metrics.totalRevenue),        trend: 'up'      as const, history },
    { label: 'Orders Today',   value: metrics.todayOrdersCount,            trend: 'up'      as const, history },
    { label: 'Total Orders',   value: metrics.ordersCount,                 trend: 'neutral' as const, history },
    { label: 'Avg Order',      value: fmtEGP(metrics.averageOrderValue),   trend: 'neutral' as const, history },
    { label: 'Conversion',     value: fmtPct(metrics.conversionRate),      trend: 'neutral' as const },
    { label: 'Returning',      value: fmtPct(metrics.returningRate),       trend: 'up'      as const },
    { label: 'New Customers',  value: metrics.newCustomers,                trend: 'up'      as const },
    { label: 'Pending',        value: metrics.pendingCount,                trend: metrics.pendingCount > 5 ? 'down' as const : 'neutral' as const },
    { label: 'Processing',     value: metrics.processingCount,             trend: 'neutral' as const },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {kpis.map((k) => (
        <AdminKpiCard key={k.label} label={k.label} value={k.value} trend={k.trend} history={k.history} />
      ))}
    </div>
  );
}
