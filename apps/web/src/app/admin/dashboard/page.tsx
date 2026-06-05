'use client';

import { useEffect, useState } from 'react';
import { getMetrics, getActivities } from '../../../lib/admin-api';
import type { AdminMetrics, ActivityEvent } from '../../../types/nickline';
import DashboardKpis from '../../../components/admin/dashboard/DashboardKpis';
import TopProductsList from '../../../components/admin/dashboard/TopProductsList';
import RecentOrdersTable from '../../../components/admin/dashboard/RecentOrdersTable';
import ActivityFeed from '../../../components/admin/dashboard/ActivityFeed';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getMetrics(), getActivities()])
      .then(([m, a]) => { setMetrics(m); setActivities(a); })
      .catch(() => setError('Failed to load dashboard data'));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>
        Dashboard
      </h1>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <DashboardKpis metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentOrdersTable />
        </div>
        <div className="flex flex-col gap-4">
          <TopProductsList categoryShare={metrics?.categoryShare ?? null} />
          <ActivityFeed initial={activities} />
        </div>
      </div>
    </div>
  );
}
