'use client';

import { formatPrice } from '../lib/formatPrice';

interface PriceDisplayProps {
  amount: number;
  currency: string;
  className?: string;
}

export default function PriceDisplay({ amount, currency, className = '' }: PriceDisplayProps) {
  return (
    <span className={`font-semibold text-warm-white ${className}`}>
      {formatPrice(amount, currency)}
    </span>
  );
}
