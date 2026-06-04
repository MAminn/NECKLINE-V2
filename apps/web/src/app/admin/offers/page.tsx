'use client';

import { useState } from 'react';
import CouponsSection from '../../../components/admin/offers/CouponsSection';
import CampaignsSection from '../../../components/admin/offers/CampaignsSection';

const TABS = ['Coupons', 'Campaigns'];

export default function OffersPage() {
  const [tab, setTab] = useState('Coupons');

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--admin-text)' }}>Offers</h1>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{
              background: tab === t ? 'var(--admin-accent)' : 'transparent',
              color: tab === t ? '#fff' : 'var(--admin-text-muted)',
              border: '1px solid var(--admin-border)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Coupons' ? <CouponsSection /> : <CampaignsSection />}
    </div>
  );
}
