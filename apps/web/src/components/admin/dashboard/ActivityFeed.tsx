'use client';

import { useEffect, useState } from 'react';
import { getActivities } from '../../../lib/admin-api';
import type { ActivityEvent } from '../../../types/nickline';

const ICON_MAP: Record<string, string> = {
  order: '◉',
  cart: '◈',
  ship: '◌',
  alert: '◊',
  user: '◎',
};

export default function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    getActivities().then(setEvents).catch(() => {});

    const interval = setInterval(() => {
      getActivities().then(setEvents).catch(() => {});
    }, 10_000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--admin-gold)' }}>
        Live Activity
      </h3>
      {events.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>No recent activity</p>
      )}
      <ul className="space-y-3 max-h-64 overflow-y-auto">
        {events.map((e) => (
          <li key={e.id} className="flex items-start gap-3">
            <span className="mt-0.5 text-base" style={{ color: 'var(--admin-accent)' }} aria-hidden="true">
              {ICON_MAP[e.iconType] ?? '◊'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-snug truncate" style={{ color: 'var(--admin-text)' }}>
                <span className="font-semibold">{e.user}</span> — {e.text}
              </p>
              {e.sub && <p className="text-[10px] truncate" style={{ color: 'var(--admin-text-muted)' }}>{e.sub}</p>}
            </div>
            <span className="shrink-0 text-[10px]" style={{ color: 'var(--admin-text-muted)' }}>{e.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
