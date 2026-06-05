'use client';

interface DataPoint {
  date: string;
  visits: number;
  checkouts: number;
}

interface Props {
  data: DataPoint[];
}

export default function AnalyticsChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl" style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}>
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No data for this period</p>
      </div>
    );
  }

  const W = 600;
  const H = 180;
  const PAD = { top: 16, right: 16, bottom: 28, left: 44 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const allValues = data.flatMap((d) => [d.visits, d.checkouts]);
  const maxVal = Math.max(...allValues, 1);

  function toX(i: number) { return PAD.left + (i / Math.max(data.length - 1, 1)) * chartW; }
  function toY(v: number) { return PAD.top + chartH - (v / maxVal) * chartH; }

  const visitPoints = data.map((d, i) => `${toX(i)},${toY(d.visits)}`).join(' ');
  const checkoutPoints = data.map((d, i) => `${toX(i)},${toY(d.checkouts)}`).join(' ');

  const labelEvery = Math.ceil(data.length / 6);

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}>
      <div className="mb-3 flex items-center gap-4">
        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-gold)' }}>
          <span className="inline-block h-2 w-4 rounded" style={{ background: 'var(--color-gold)' }} /> Visits
        </span>
        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-primary)' }}>
          <span className="inline-block h-2 w-4 rounded" style={{ background: 'var(--color-primary)' }} /> Checkouts
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 180 }}>
        {/* Y grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = PAD.top + chartH * (1 - f);
          return (
            <g key={f}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="var(--color-admin-border)" strokeWidth="1" />
              <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize="10" fill="var(--color-text-tertiary)">
                {Math.round(maxVal * f)}
              </text>
            </g>
          );
        })}

        {/* Data lines */}
        <polyline points={visitPoints} fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={checkoutPoints} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* X labels */}
        {data.map((d, i) => {
          if (i % labelEvery !== 0) return null;
          return (
            <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="var(--color-text-tertiary)">
              {d.date.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
