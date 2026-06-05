import { Suspense } from 'react';
import OrderConfirmationClient from './OrderConfirmationClient';

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-bg text-text-primary">
        <div className="mx-auto max-w-container px-4 py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="mt-4 text-text-secondary">Loading order...</p>
        </div>
      </main>
    }>
      <OrderConfirmationClient />
    </Suspense>
  );
}
