'use client';

import { adminCard } from '../adminStyles';

interface CategoryShare { name: string; share: number; color: string; }
interface Props { categoryShare: CategoryShare[] | null; }

const cardStyle = { ...adminCard, borderRadius: 12 } as const;

export default function TopProductsList({ categoryShare }: Props) {
  if (!categoryShare) return null;
  if (!categoryShare.length) return null;

  const max = Math.max(...categoryShare.map((i) => i.share));

  return (
    <div className="rounded-xl p-4" style={cardStyle}>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--admin-gold)' }}>
        Top Categories
      </h3>
      <ul className="space-y-2.5">
        {categoryShare.map((item, idx) => (
          <li key={item.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--admin-text)' }}>
                <span className="mr-2 font-bold" style={{ color: 'var(--admin-text-muted)' }}>#{idx + 1}</span>
                {item.name}
              </span>
              <span className="text-xs font-bold" style={{ color: 'var(--admin-gold)' }}>{item.share}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--admin-border)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(item.share / max) * 100}%`, background: 'var(--admin-accent)' }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
