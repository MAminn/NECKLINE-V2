'use client';

import DashboardKpis from '../../../components/admin/dashboard/DashboardKpis';
import TopProductsList from '../../../components/admin/dashboard/TopProductsList';
import RecentOrdersTable from '../../../components/admin/dashboard/RecentOrdersTable';
import ActivityFeed from '../../../components/admin/dashboard/ActivityFeed';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--admin-text)' }}>
        Dashboard
      </h1>

      <DashboardKpis />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentOrdersTable />
        </div>
        <div className="flex flex-col gap-4">
          <TopProductsList />
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
