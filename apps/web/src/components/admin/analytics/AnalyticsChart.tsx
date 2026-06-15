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
      <div
        className="flex h-64 items-center justify-center rounded-2xl"
        style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          No data for this period
        </p>
      </div>
    );
  }

  const W = 800;
  const H = 260;
  const PAD = { top: 24, right: 24, bottom: 36, left: 52 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const allValues = data.flatMap((d) => [d.visits, d.checkouts]);
  const maxVal = Math.max(...allValues, 1);

  function toX(i: number) {
    return PAD.left + (i / Math.max(data.length - 1, 1)) * chartW;
  }
  function toY(v: number) {
    return PAD.top + chartH - (v / maxVal) * chartH;
  }

  const visitPoints = data.map((d, i) => `${toX(i)},${toY(d.visits)}`).join(' ');
  const checkoutPoints = data.map((d, i) => `${toX(i)},${toY(d.checkouts)}`).join(' ');

  const visitAreaPoints = `${PAD.left},${PAD.top + chartH} ${visitPoints} ${toX(data.length - 1)},${PAD.top + chartH}`;
  const checkoutAreaPoints = `${PAD.left},${PAD.top + chartH} ${checkoutPoints} ${toX(data.length - 1)},${PAD.top + chartH}`;

  const labelEvery = Math.ceil(data.length / 7);

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-gold)' }}>
          Traffic & Checkouts
        </h3>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-gold)' }}>
            <span className="inline-block h-2 w-3 rounded-sm" style={{ background: 'var(--color-gold)' }} /> Visits
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-primary)' }}>
            <span className="inline-block h-2 w-3 rounded-sm" style={{ background: 'var(--color-primary)' }} /> Checkouts
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet" style={{ height: 280 }}>
        <defs>
          <linearGradient id="visitGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="checkoutGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = PAD.top + chartH * (1 - f);
          return (
            <g key={f}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y}
                y2={y}
                stroke="var(--color-admin-border)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--color-text-tertiary)">
                {Math.round(maxVal * f)}
              </text>
            </g>
          );
        })}

        {/* Area fills */}
        <polygon points={visitAreaPoints} fill="url(#visitGradient)" />
        <polygon points={checkoutAreaPoints} fill="url(#checkoutGradient)" />

        {/* Data lines */}
        <polyline
          points={visitPoints}
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={checkoutPoints}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {data.map((d, i) => (
          <g key={`dot-${i}`}>
            <circle cx={toX(i)} cy={toY(d.visits)} r="3" fill="var(--color-gold)" stroke="var(--color-admin-surface)" strokeWidth="1.5" />
            <circle cx={toX(i)} cy={toY(d.checkouts)} r="3" fill="var(--color-primary)" stroke="var(--color-admin-surface)" strokeWidth="1.5" />
          </g>
        ))}

        {/* X labels */}
        {data.map((d, i) => {
          if (i % labelEvery !== 0) return null;
          return (
            <text
              key={`label-${i}`}
              x={toX(i)}
              y={H - 10}
              textAnchor="middle"
              fontSize="10"
              fill="var(--color-text-tertiary)"
            >
              {d.date.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
