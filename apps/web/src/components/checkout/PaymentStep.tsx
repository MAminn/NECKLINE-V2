'use client';

interface PaymentStepProps {
  onRetry: () => void;
  error?: string | null;
  isProcessing: boolean;
}

export default function PaymentStep({ onRetry, error, isProcessing }: PaymentStepProps) {
  if (isProcessing) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        <p className="font-display uppercase tracking-wide">Processing Payment...</p>
        <p className="text-sm text-text-secondary">Please do not close this window.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-primary/10 p-4 text-center">
          <p className="font-display text-lg uppercase tracking-wide text-primary">Payment Failed</p>
          <p className="mt-1 text-sm text-text-secondary">{error}</p>
        </div>
        <button
          onClick={onRetry}
          className="w-full rounded-md bg-gold py-3 font-medium uppercase tracking-wide text-bg transition-colors hover:brightness-110"
        >
          Try Again
        </button>
      </div>
    );
  }

  return null;
}
