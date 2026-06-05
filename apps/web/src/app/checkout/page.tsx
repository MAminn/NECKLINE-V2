'use client';

import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { createCheckoutSession, createOrder } from '../../lib/checkout-api';
import PromoCodeInput from '../../components/checkout/PromoCodeInput';
import ShippingStep from '../../components/checkout/ShippingStep';
import ReviewStep from '../../components/checkout/ReviewStep';
import PaymentStep from '../../components/checkout/PaymentStep';
import OrderSummary from '../../components/checkout/OrderSummary';

type Step = 'shipping' | 'review' | 'payment';

const STEPS: { id: Step; label: string }[] = [
  { id: 'shipping', label: 'Shipping' },
  { id: 'review',   label: 'Review'   },
  { id: 'payment',  label: 'Payment'  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isLoading, applyPromoCode, removePromoCode } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [step, setStep] = useState<Step>('shipping');
  const [checkoutToken, setCheckoutToken] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [contact, setContact] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);

  if (!isLoading && cart.items.length === 0 && !checkoutToken) {
    return (
      <main className="min-h-screen bg-bg text-text-primary">
        <div className="mx-auto max-w-container px-4 py-12 text-center">
          <h1 className="font-display text-3xl uppercase tracking-wide">Checkout</h1>
          <p className="mt-4 text-text-secondary">Your cart is empty.</p>
          <a
            href="/"
            className="mt-6 inline-block rounded-sm bg-primary px-8 py-3 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-primary-hover"
          >
            Continue Shopping
          </a>
        </div>
      </main>
    );
  }

  const currentStepIndex = STEPS.findIndex(s => s.id === step);

  async function handleShippingSubmit(data: any) {
    setShippingError(null);
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
        promoCode: cart.appliedPromoCode || null,
      });

      setCheckoutToken(result.checkoutToken);
      setPreview(result.orderPreview);
      setStep('review');
    } catch (err: any) {
      const msg = err.message || 'Failed to start checkout. Please try again.';
      setShippingError(msg);
      addToast(msg, { type: 'error' });
    }
  }

  async function handlePay() {
    if (!checkoutToken) return;
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const result = await createOrder({ checkoutToken, paymentMethod: 'paymob' });

      if (result.payUrl) {
        window.location.href = result.payUrl;
        return;
      }

      router.push(`/order-confirmation/${result.order.orderNumber}`);
    } catch (err: any) {
      setIsProcessing(false);
      const msg =
        err.code === 'STOCK_UNAVAILABLE'
          ? 'Some items are no longer available. Please return to your cart.'
          : err.message || 'Something went wrong. Please try again.';
      setPaymentError(msg);
    }
  }

  return (
    <main className="min-h-screen bg-bg text-text-primary">
      <div className="mx-auto max-w-container px-4 py-12">
        <h1 className="font-display text-3xl uppercase tracking-wide">Checkout</h1>

        {/* Step indicator — numbered circles with connecting lines */}
        <div className="mt-8 flex items-center">
          {STEPS.map((s, i) => {
            const isActive = step === s.id;
            const isDone = i < currentStepIndex;
            return (
              <Fragment key={s.id}>
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition-colors duration-200
                      ${isDone
                        ? 'border-primary bg-primary text-white'
                        : isActive
                        ? 'border-primary bg-transparent text-primary'
                        : 'border-border bg-transparent text-text-muted'
                      }`}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
                  </div>
                  <span
                    className={`hidden text-xs uppercase tracking-widest transition-colors duration-200 sm:block
                      ${isActive ? 'text-text-primary' : isDone ? 'text-text-secondary' : 'text-text-muted'}`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-3 h-px flex-1 transition-colors duration-300 ${isDone ? 'bg-primary' : 'bg-border'}`}
                  />
                )}
              </Fragment>
            );
          })}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main form */}
          <div className="lg:col-span-2">
            {step === 'shipping' && (
              <>
                {shippingError && (
                  <div className="alert-error mb-6 flex items-start gap-2.5 text-sm">
                    <span>{shippingError}</span>
                  </div>
                )}
                <ShippingStep onSubmit={handleShippingSubmit} />
              </>
            )}

            {step === 'review' && preview && contact && shippingAddress && (
              <ReviewStep
                preview={preview}
                contact={contact}
                shippingAddress={shippingAddress}
                appliedPromoCode={cart.appliedPromoCode}
                onApplyPromo={async (code) => {
                  await applyPromoCode(code);
                  const refreshed = await createCheckoutSession({
                    cartId: cart.cartId,
                    contact,
                    shippingAddress,
                    promoCode: code,
                  });
                  setPreview(refreshed.orderPreview);
                }}
                onRemovePromo={async () => {
                  await removePromoCode();
                  const refreshed = await createCheckoutSession({
                    cartId: cart.cartId,
                    contact,
                    shippingAddress,
                  });
                  setPreview(refreshed.orderPreview);
                }}
                onConfirm={handlePay}
                onBack={() => setStep('shipping')}
              />
            )}

            {step === 'payment' && (
              <PaymentStep
                isProcessing={isProcessing}
                error={paymentError}
                onRetry={() => { setPaymentError(null); setStep('review'); }}
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
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-surface p-6">
                  <h3 className="font-display text-base uppercase tracking-wide text-text-primary">
                    Cart Summary
                  </h3>
                  <div className="mt-4 space-y-2">
                    {cart.items.map((item: any) => (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span className="text-text-secondary">{item.name} × {item.quantity}</span>
                        <span className="font-display text-text-primary">
                          {item.lineTotal?.amount} {item.lineTotal?.currency}
                        </span>
                      </div>
                    ))}
                  </div>
                  {cart.discount && cart.discount.amount > 0 && (
                    <div className="mt-2 flex justify-between text-sm text-primary">
                      <span>Discount {cart.discount.code ? `(${cart.discount.code})` : ''}</span>
                      <span className="font-display">-{cart.discount.amount} {cart.discount.currency}</span>
                    </div>
                  )}
                  <div className="mt-4 border-t border-border pt-3 flex justify-between font-display text-sm">
                    <span className="text-text-secondary uppercase tracking-wide">Subtotal</span>
                    <span className="text-text-primary">{cart.subtotal?.amount} {cart.subtotal?.currency}</span>
                  </div>
                  {cart.shipping && (
                    <div className="mt-1.5 flex justify-between text-sm text-text-secondary">
                      <span>Shipping</span>
                      <span>{cart.shipping.amount === 0 ? 'Free' : `${cart.shipping.amount} ${cart.shipping.currency}`}</span>
                    </div>
                  )}
                  {cart.total && (
                    <div className="mt-3 flex justify-between font-display text-gold border-t border-border pt-3">
                      <span className="uppercase tracking-wide">Total</span>
                      <span>{cart.total.amount} {cart.total.currency}</span>
                    </div>
                  )}
                </div>
                <PromoCodeInput
                  appliedCode={cart.appliedPromoCode}
                  onApply={applyPromoCode}
                  onRemove={removePromoCode}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
