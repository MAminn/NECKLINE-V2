'use client';

import { useEffect, useState } from 'react';
import { getActivities } from '../../../lib/admin-api';
import type { ActivityEvent } from '../../../types/nickline';
import { adminCard } from '../adminStyles';

const ICON_MAP: Record<string, string> = {
  order: '◉', cart: '◈', ship: '◌', alert: '◊', user: '◎',
};

const cardStyle = { ...adminCard, borderRadius: 12 } as const;

interface Props { initial?: ActivityEvent[]; }

export default function ActivityFeed({ initial = [] }: Props) {
  const [events, setEvents] = useState<ActivityEvent[]>(initial);

  // Sync if parent provides hydrated initial data
  useEffect(() => {
    if (initial.length) setEvents(initial);
  }, [initial]);

  // Poll every 10s for live updates (satisfies US1 AS2)
  useEffect(() => {
    const id = setInterval(() => {
      getActivities().then(setEvents).catch(() => {});
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-xl p-4" style={cardStyle}>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--admin-gold)' }}>
        Live Activity
      </h3>
      {!events.length && (
        <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>No recent activity</p>
      )}
      <ul className="space-y-3 max-h-64 overflow-y-auto">
        {events.map((e) => (
          <li key={e.id} className="flex items-start gap-3">
            <span className="mt-0.5 text-base shrink-0" style={{ color: 'var(--admin-accent)' }} aria-hidden="true">
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
