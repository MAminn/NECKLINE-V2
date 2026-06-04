'use client';

interface AdminKpiCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  history?: number[];
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data) || 1;
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 32;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="var(--admin-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
}

function formatValue(value: string | number): string {
  if (typeof value === 'number') {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString();
  }
  return value;
}

export default function AdminKpiCard({ label, value, trend = 'neutral', history = [] }: AdminKpiCardProps) {
  const trendColor = trend === 'up' ? '#4ade80' : trend === 'down' ? 'var(--admin-accent)' : 'var(--admin-text-muted)';
  const trendArrow = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—';

  return (
    <div
      className="flex flex-col justify-between rounded-xl p-4 h-28"
      style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
    >
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest truncate pr-2" style={{ color: 'var(--admin-gold)' }}>
          {label}
        </p>
        {trend !== 'neutral' && (
          <span className="text-[10px] font-bold" style={{ color: trendColor }}>{trendArrow}</span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-bold leading-none" style={{ color: 'var(--admin-text)' }}>
          {formatValue(value)}
        </p>
        {history.length >= 2 && <Sparkline data={history} />}
      </div>
    </div>
  );
}
