'use client';

export default function PaymentRedirect() {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      <p className="font-display uppercase tracking-wide">Redirecting to Secure Payment...</p>
      <p className="text-sm text-text-secondary">You will be redirected to Paymob to complete your purchase.</p>
    </div>
  );
}
