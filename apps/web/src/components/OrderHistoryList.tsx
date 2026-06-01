'use client';

interface Order {
  id: string;
  orderNumber: string;
  total: { amount: number; currency: string };
  status: string;
  createdAt: string;
}

export default function OrderHistoryList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-md border border-border bg-muted px-4 py-8 text-center">
        <p className="text-text-secondary">No orders yet.</p>
        <a href="/" className="mt-2 inline-block text-sm text-text-primary underline">
          Start shopping
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between rounded-md border border-border px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium text-text-primary">#{order.orderNumber}</p>
            <p className="text-xs text-text-secondary">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-text-primary">
              {order.total.currency} {(order.total.amount / 100).toFixed(2)}
            </p>
            <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-text-secondary">
              {order.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
