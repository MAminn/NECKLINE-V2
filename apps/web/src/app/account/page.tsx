'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import AccountProfile from '../../components/AccountProfile';
import OrderHistoryList from '../../components/OrderHistoryList';

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?returnUrl=${encodeURIComponent('/account')}`);
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // TODO: Fetch orders from API when Phase 4 delivers orders
  const orders: any[] = [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 font-display text-2xl uppercase tracking-widest text-text-primary">
        My Account
      </h1>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <AccountProfile />
        </div>
        <div>
          <h2 className="mb-4 font-display text-lg uppercase tracking-widest text-text-primary">
            Order History
          </h2>
          <OrderHistoryList />
        </div>
      </div>
    </div>
  );
}
