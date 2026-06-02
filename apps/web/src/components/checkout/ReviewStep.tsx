'use client';

import OrderSummary from './OrderSummary';

interface ReviewStepProps {
  preview: {
    lineItems: { sku: string; title: string; unitPrice: number; currency: string; quantity: number; lineTotal: number }[];
    subtotal: number;
    shipping: { method: string; cost: number; currency: string };
    total: number;
    currency: string;
  };
  contact: { name: string; email: string; phone: string };
  shippingAddress: { street: string; city: string; governorate: string; postalCode: string };
  onConfirm: () => void;
  onBack: () => void;
}

export default function ReviewStep({ preview, contact, shippingAddress, onConfirm, onBack }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl uppercase tracking-wide">Review Your Order</h2>

      <div className="rounded-lg bg-surface-alt p-6">
        <h3 className="font-display text-sm uppercase tracking-wide text-text-secondary">Shipping To</h3>
        <div className="mt-2 text-sm">
          <p className="font-medium">{contact.name}</p>
          <p>{contact.email}</p>
          <p>{contact.phone}</p>
          <p className="mt-1 text-text-secondary">
            {shippingAddress.street}, {shippingAddress.city}, {shippingAddress.governorate}, {shippingAddress.postalCode}
          </p>
        </div>
      </div>

      <OrderSummary
        lineItems={preview.lineItems}
        subtotal={preview.subtotal}
        shipping={preview.shipping}
        total={preview.total}
        currency={preview.currency}
      />

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-md border border-border bg-bg py-3 font-medium uppercase tracking-wide text-text-primary transition-colors hover:bg-surface-alt"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 rounded-md bg-gold py-3 font-medium uppercase tracking-wide text-bg transition-colors hover:brightness-110"
        >
          Pay Now
        </button>
      </div>
    </div>
  );
}
