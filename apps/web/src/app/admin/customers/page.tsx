'use client';

import { useState } from 'react';
import CustomersTable from '../../../components/admin/customers/CustomersTable';
import CustomerDetailSidebar from '../../../components/admin/customers/CustomerDetailSidebar';
import type { AdminCustomer } from '../../../types/nickline';

export default function CustomersPage() {
  const [selected, setSelected] = useState<AdminCustomer | null>(null);
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--admin-text)' }}>Customers</h1>
      <CustomersTable onSelectCustomer={setSelected} refresh={refresh} />
      <CustomerDetailSidebar
        customer={selected}
        onClose={() => setSelected(null)}
        onDeleted={() => setRefresh((r) => r + 1)}
      />
    </div>
  );
}
