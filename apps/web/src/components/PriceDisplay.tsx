'use client';

import { formatPrice } from '../lib/formatPrice';

interface PriceDisplayProps {
  amount: number;
  currency: string;
  className?: string;
}

export default function PriceDisplay({ amount, currency, className = '' }: PriceDisplayProps) {
  return (
    <span className={`font-semibold text-text-primary ${className}`}>
      {formatPrice(amount, currency)}
    </span>
  );
}
