'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import AdminSidebar from '../../components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== 'admin') {
      router.replace('/login?redirect=/admin');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--admin-bg)' }}>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: 'var(--admin-accent)' }} />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6" style={{ color: 'var(--admin-text)' }}>
        {children}
      </main>
    </div>
  );
}
