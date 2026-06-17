'use client';

import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Activity, Package, Target } from 'lucide-react';
import { getMetrics } from '../../../lib/admin-api';
import type { AdminMetrics } from '../../../types/nickline';
import AnalyticsChart from '../../../components/admin/analytics/AnalyticsChart';
import { formatPrice } from '../../../lib/formatPrice';
import { DEFAULT_CURRENCY } from '../../../lib/constants';
import AdminKpiCard from '../../../components/admin/AdminKpiCard';

const TIMEFRAMES = ['7D', '30D', 'ALL'] as const;
type Timeframe = typeof TIMEFRAMES[number];

function deriveSparkline(history: { date: string; checkouts: number }[]) {
  if (!history?.length) return [];
  return history.map((d) => d.checkouts);
}

function classNames(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('30D');

  useEffect(() => {
    getMetrics().then(setMetrics).catch(() => {});
  }, []);

  const history = useMemo(() => metrics?.visitsHistory ?? [], [metrics?.visitsHistory]);
  const filtered = timeframe === '7D' ? history.slice(-7) : timeframe === '30D' ? history.slice(-30) : history;

  const productShare = useMemo(() => {
    if (!metrics?.productShare?.length) return [];
    const total = metrics.productShare.reduce((s, p) => s + p.share, 0) || 1;
    return metrics.productShare.map((p) => ({ ...p, width: `${(p.share / total) * 100}%` }));
  }, [metrics?.productShare]);

  const conversionHistory = useMemo(() => deriveSparkline(history), [history]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>
            Analytics
          </h1>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Real-time performance overview
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex gap-2 rounded-xl p-1" style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}>
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={classNames(
                'rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-200',
                timeframe === t && 'shadow-sm'
              )}
              style={{
                background: timeframe === t ? 'var(--color-primary)' : 'transparent',
                color: timeframe === t ? '#fff' : 'var(--color-text-tertiary)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AdminKpiCard
            label="Total Revenue"
            value={formatPrice(metrics.totalRevenue, DEFAULT_CURRENCY)}
            trend="up"
            history={conversionHistory}
          />
          <AdminKpiCard
            label="Orders"
            value={metrics.ordersCount}
            trend="neutral"
            history={deriveSparkline(history)}
          />
          <AdminKpiCard
            label="Avg Order Value"
            value={formatPrice(metrics.averageOrderValue, DEFAULT_CURRENCY)}
            trend="up"
          />
          <AdminKpiCard
            label="New Customers (7d)"
            value={metrics.newCustomers}
            trend="up"
          />
        </div>
      )}

      {/* Main chart */}
      <AnalyticsChart data={filtered} />

      {/* Secondary metrics grid */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Revenue today */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(184,168,138,0.12)' }}>
                <DollarSign size={18} style={{ color: 'var(--color-gold)' }} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>
                Revenue Today
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              {formatPrice(metrics.revenueToday, DEFAULT_CURRENCY)}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {metrics.todayOrdersCount} orders today
            </p>
          </div>

          {/* Pending & processing */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.12)' }}>
                <ShoppingBag size={18} style={{ color: 'var(--color-primary)' }} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>
                Order Pipeline
              </span>
            </div>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{metrics.pendingCount}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{metrics.processingCount}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Processing</p>
              </div>
            </div>
          </div>

          {/* Returning rate */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(122,155,118,0.12)' }}>
                <Users size={18} style={{ color: 'var(--success)' }} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>
                Returning Rate
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              {(metrics.returningRate * 100).toFixed(1)}%
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Of confirmed customers
            </p>
          </div>
        </div>
      )}

      {/* Bottom grid: product share + forecast */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Product share */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(184,168,138,0.12)' }}>
                <Package size={18} style={{ color: 'var(--color-gold)' }} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-gold)' }}>
                Sales by Product
              </span>
            </div>
            {productShare.length > 0 ? (
              <div className="space-y-4">
                {productShare.map((p) => (
                  <div key={p.name}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span style={{ color: 'var(--color-text)' }}>{p.name}</span>
                      <span style={{ color: 'var(--color-text-tertiary)' }}>{p.share}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: p.width, background: p.color || 'var(--color-primary)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No sales data yet.</p>
            )}
          </div>

          {/* Forecast */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.12)' }}>
                <Target size={18} style={{ color: 'var(--color-primary)' }} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>
                Forecast
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Projected Growth</p>
                <p className="text-xl font-bold flex items-center gap-1.5" style={{ color: 'var(--success)' }}>
                  {metrics.forecast.increase != null ? (
                    <>
                      <TrendingUp size={16} /> +{metrics.forecast.increase}%
                    </>
                  ) : (
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Not tracked yet</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Projected Revenue</p>
                <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {metrics.forecast.projectedRevenue != null
                    ? formatPrice(metrics.forecast.projectedRevenue, DEFAULT_CURRENCY)
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Recommended Stock</p>
                <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {metrics.forecast.recommendedStock ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Top Product</p>
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-gold)' }}>{metrics.forecast.topProduct}</p>
              </div>
            </div>
            <div className="rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span style={{ color: 'var(--color-text-tertiary)' }}>
                Based on the last 30 days of confirmed orders.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Live sessions placeholder */}
      {metrics && (
        <div
          className="flex items-center justify-between rounded-2xl px-5 py-4"
          style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}
        >
          <div className="flex items-center gap-3">
            <Activity size={18} style={{ color: 'var(--success)' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>
              Live Sessions
            </span>
          </div>
          <span className="text-sm font-bold" style={{ color: metrics.liveSessions != null ? 'var(--color-text)' : 'var(--color-text-tertiary)' }}>
            {metrics.liveSessions != null ? metrics.liveSessions : 'Not tracked yet'}
          </span>
        </div>
      )}
    </div>
  );
}
