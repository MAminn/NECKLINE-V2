'use client';

import { adminCard } from '../adminStyles';

interface ProductShare { name: string; share: number; color: string; }
interface Props { productShare: ProductShare[] | null; }

const cardStyle = { ...adminCard, borderRadius: 12 } as const;

export default function TopProductsList({ productShare }: Props) {
  if (!productShare) return null;
  if (!productShare.length) return null;

  const max = Math.max(...productShare.map((i) => i.share));

  return (
    <div className="rounded-xl p-4" style={cardStyle}>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-gold)' }}>
        Top Products
      </h3>
      <ul className="space-y-2.5">
        {productShare.map((item, idx) => (
          <li key={item.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--color-text)' }}>
                <span className="mr-2 font-bold" style={{ color: 'var(--color-text-tertiary)' }}>#{idx + 1}</span>
                {item.name}
              </span>
              <span className="text-xs font-bold" style={{ color: 'var(--color-gold)' }}>{item.share}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-admin-border)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(item.share / max) * 100}%`, background: 'var(--color-primary)' }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
