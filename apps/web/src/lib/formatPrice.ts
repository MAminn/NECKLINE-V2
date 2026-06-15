const CURRENCY_SYMBOLS: Record<string, string> = {
  EGP: 'EGP',
  USD: '$',
  SAR: 'SAR',
};

/**
 * Format a price amount for display.
 * Amounts are stored/transmitted in minor units (cents/piastres) and
 * converted to the main currency unit here.
 */
export function formatPrice(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const value = (amount / 100).toFixed(2);

  if (currency === 'USD') {
    return `${symbol}${value}`;
  }

  return `${symbol} ${value}`;
}
