'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { createCheckoutSession, createOrder } from '../../lib/checkout-api';
import ShippingStep from '../../components/checkout/ShippingStep';
import ReviewStep from '../../components/checkout/ReviewStep';
import PaymentStep from '../../components/checkout/PaymentStep';
import OrderSummary from '../../components/checkout/OrderSummary';

type Step = 'shipping' | 'review' | 'payment';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isLoading } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('shipping');
  const [checkoutToken, setCheckoutToken] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [contact, setContact] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Redirect empty cart
  if (!isLoading && cart.items.length === 0 && !checkoutToken) {
    return (
      <main className="min-h-screen bg-bg text-text-primary">
        <div className="mx-auto max-w-container px-4 py-12 text-center">
          <h1 className="font-display text-3xl uppercase tracking-wide">Checkout</h1>
          <p className="mt-4 text-text-secondary">Your cart is empty.</p>
          <a
            href="/"
            className="mt-6 inline-block rounded-md bg-primary px-8 py-3 font-medium uppercase tracking-wide text-text-inverse transition-colors hover:bg-primary-hover"
          >
            Continue Shopping
          </a>
        </div>
      </main>
    );
  }

  async function handleShippingSubmit(data: any) {
    try {
      setContact({ name: data.name, email: data.email, phone: data.phone });
      setShippingAddress({
        street: data.street,
        city: data.city,
        governorate: data.governorate,
        postalCode: data.postalCode,
      });

      const result = await createCheckoutSession({
        cartId: cart.cartId,
        contact: { name: data.name, email: data.email, phone: data.phone },
        shippingAddress: {
          street: data.street,
          city: data.city,
          governorate: data.governorate,
          postalCode: data.postalCode,
        },
      });

      setCheckoutToken(result.checkoutToken);
      setPreview(result.orderPreview);
      setStep('review');
    } catch (err: any) {
      alert(err.message || 'Failed to start checkout. Please try again.');
    }
  }

  async function handlePay() {
    if (!checkoutToken) return;
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const result = await createOrder({ checkoutToken, paymentMethod: 'stub' });
      router.push(`/order-confirmation/${result.order.orderNumber}`);
    } catch (err: any) {
      setIsProcessing(false);
      if (err.status === 402) {
        setPaymentError(err.message || 'Payment was declined. Please try again.');
      } else if (err.code === 'STOCK_UNAVAILABLE') {
        setPaymentError('Some items are no longer available. Please return to your cart.');
      } else {
        setPaymentError(err.message || 'Something went wrong. Please try again.');
      }
    }
  }

  return (
    <main className="min-h-screen bg-bg text-text-primary">
      <div className="mx-auto max-w-container px-4 py-12">
        <h1 className="font-display text-3xl uppercase tracking-wide">Checkout</h1>

        {/* Step indicator */}
        <div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-wide">
          <span className={step === 'shipping' ? 'text-gold' : 'text-text-secondary'}>Shipping</span>
          <span className="text-text-tertiary">→</span>
          <span className={step === 'review' ? 'text-gold' : 'text-text-secondary'}>Review</span>
          <span className="text-text-tertiary">→</span>
          <span className={step === 'payment' ? 'text-gold' : 'text-text-secondary'}>Payment</span>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main form */}
          <div className="lg:col-span-2">
            {step === 'shipping' && <ShippingStep onSubmit={handleShippingSubmit} />}

            {step === 'review' && preview && contact && shippingAddress && (
              <ReviewStep
                preview={preview}
                contact={contact}
                shippingAddress={shippingAddress}
                onConfirm={handlePay}
                onBack={() => setStep('shipping')}
              />
            )}

            {step === 'payment' && (
              <PaymentStep
                isProcessing={isProcessing}
                error={paymentError}
                onRetry={() => {
                  setPaymentError(null);
                  setStep('review');
                }}
              />
            )}
          </div>

          {/* Side summary */}
          <div>
            {preview && (
              <OrderSummary
                lineItems={preview.lineItems}
                subtotal={preview.subtotal}
                shipping={preview.shipping}
                total={preview.total}
                currency={preview.currency}
              />
            )}

            {!preview && cart.items.length > 0 && (
              <div className="rounded-lg bg-surface-alt p-6">
                <h3 className="font-display text-lg uppercase tracking-wide">Cart Summary</h3>
                <div className="mt-4 space-y-2">
                  {cart.items.map((item: any) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span className="font-display">
                        {item.lineTotal?.amount} {item.lineTotal?.currency}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t border-border pt-2 flex justify-between font-display">
                  <span>Subtotal</span>
                  <span>
                    {cart.subtotal?.amount} {cart.subtotal?.currency}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
