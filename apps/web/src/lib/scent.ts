/**
 * Scent → accent color mapping used for aura glows and gradient bars.
 */
const SCENT_COLORS: Record<string, string> = {
  oud: '#C87941',
  rose: '#C97B7B',
  musk: '#9BA4A9',
  original: '#B8A88A',
  giftset: '#B8A88A',
};

export function getScentColor(scentId: string): string {
  return SCENT_COLORS[scentId.toLowerCase()] || '#DC2626';
}
