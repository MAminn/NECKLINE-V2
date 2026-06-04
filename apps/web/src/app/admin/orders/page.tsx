'use client';

import { useState } from 'react';
import OrdersTable from '../../../components/admin/orders/OrdersTable';
import OrderDetailSidebar from '../../../components/admin/orders/OrderDetailSidebar';
import type { AdminOrder } from '../../../types/nickline';

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [refresh, setRefresh] = useState(0);

  function handleUpdated(order: AdminOrder) {
    setSelectedOrder(order);
    setRefresh((r) => r + 1);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--admin-text)' }}>Orders</h1>
      <OrdersTable onSelectOrder={setSelectedOrder} refresh={refresh} />
      <OrderDetailSidebar
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
