import { Scent, Review, QuizQuestion } from '../types/nickline';

export const LOCAL_PRODUCTS: Scent[] = [
  {
    id: 'oud',
    name: 'NECKLINE Oud',
    subtitle: 'Solid Perfume',
    description: 'Rich oud wood blended with saffron and rose. Bold and unforgettable.',
    price: 55000,
    currency: 'EGP',
    image: '/images/product-oud.jpg',
    tag: 'OUD',
    category: 'SOLID PERFUME',
  },
  {
    id: 'rose',
    name: 'NECKLINE Rose',
    subtitle: 'Solid Perfume',
    description: 'Damask rose petals wrapped in soft sandalwood. Feminine and tender.',
    price: 48000,
    currency: 'EGP',
    image: '/images/product-rose.jpg',
    tag: 'ROSE',
    category: 'SOLID PERFUME',
  },
  {
    id: 'musk',
    name: 'NECKLINE Musk',
    subtitle: 'Solid Perfume',
    description: 'White musk with a touch of citrus. Clean, fresh, and versatile.',
    price: 42000,
    currency: 'EGP',
    image: '/images/product-musk.jpg',
    tag: 'MUSK',
    category: 'SOLID PERFUME',
  },
  {
    id: 'original',
    name: 'NECKLINE Original',
    subtitle: 'Solid Perfume',
    description: 'Our signature blend. Warm amber with vanilla and subtle spice.',
    price: 45000,
    currency: 'EGP',
    image: '/images/product-original.jpg',
    tag: 'SIGNATURE',
    category: 'SOLID PERFUME',
  },
  {
    id: 'giftset',
    name: 'NECKLINE Intimacy Collection',
    subtitle: 'Gift Set',
    description: 'All four scents in one luxury gift box. The complete NECKLINE experience.',
    price: 165000,
    currency: 'EGP',
    image: '/images/product-giftset.jpg',
    tag: 'GIFT',
    category: 'GIFT SET',
  },
];

export const LOCAL_REVIEWS: Review[] = [
  {
    id: '1',
    name: 'Sarah M.',
    product: 'NECKLINE Rose',
    rating: 5,
    comment: "This scent stays so close to the skin — my partner only notices when they're near me. That's exactly what I wanted. Intimate, warm, unforgettable.",
    verified: true,
    date: '2026-05-12',
  },
  {
    id: '2',
    name: 'James K.',
    product: 'NECKLINE Oud',
    rating: 5,
    comment: "I've worn liquid colognes for 15 years. This is different. It melts into your skin and becomes part of you. The Oud is deep, resinous, commanding.",
    verified: true,
    date: '2026-05-10',
  },
  {
    id: '3',
    name: 'Elena R.',
    product: 'NECKLINE Intimacy Collection',
    rating: 5,
    comment: 'Bought the gift set for my anniversary. The packaging alone is worth it — matte black, crimson ribbon, pure luxury. Each scent tells a different story.',
    verified: true,
    date: '2026-05-08',
  },
  {
    id: '4',
    name: 'David L.',
    product: 'NECKLINE Musk',
    rating: 5,
    comment: 'The portability is a game changer. I keep it in my pocket and reapply before dinner. The Musk is clean but has depth — never overpowering.',
    verified: true,
    date: '2026-05-05',
  },
  {
    id: '5',
    name: 'Amira T.',
    product: 'NECKLINE Original',
    rating: 5,
    comment: 'I was skeptical about solid perfume. NECKLINE converted me. The Original scent is warm, amber-vanilla perfection. Lasts all day on my pulse points.',
    verified: true,
    date: '2026-05-01',
  },
  {
    id: '6',
    name: 'Noor A.',
    product: 'NECKLINE Rose',
    rating: 5,
    comment: 'The ritual of application is part of the experience. Swipe, dab, melt, feel — it\'s meditative. The Rose is soft sandalwood wrapped in petals.',
    verified: true,
    date: '2026-04-28',
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'WHAT DO YOU WANT YOUR SCENT TO SAY WITHOUT A WORD?',
    options: [
      { label: 'I am desired', value: 'desired', description: 'A warm, skin-close aura that pulls people in quietly' },
      { label: 'I am powerful', value: 'powerful', description: 'Rich, dark, and commanding — a scent that walks in before you do' },
      { label: 'I am romantic', value: 'romantic', description: 'Soft, warm blooms — feminine, tender, unforgettable up close' },
      { label: 'I am mysterious', value: 'mysterious', description: 'Depth and intrigue — resins, shadow, and ancient warmth' },
    ],
  },
  {
    id: 2,
    question: 'WHICH NOTE FAMILY MOVES YOU MOST?',
    options: [
      { label: 'Oud & Incense', value: 'oud', description: 'Ancient, smouldering, reverent — a scent with centuries behind it' },
      { label: 'Amber & Vanilla', value: 'original', description: 'Golden, skin-like, infinitely comforting' },
      { label: 'Rose & Musk', value: 'rose', description: 'Romantic and soft — a second skin for intimate moments' },
      { label: 'Spices & Cedar', value: 'musk', description: 'Sharp, grounding — warm earth with a spark of heat' },
    ],
  },
  {
    id: 3,
    question: 'WHEN DO YOU WEAR YOUR SCENT?',
    options: [
      { label: 'Day', value: 'musk', description: 'Fresh, clean energy for morning confidence' },
      { label: 'Evening', value: 'oud', description: 'Deep, commanding presence for the night' },
      { label: 'Special moments', value: 'rose', description: 'Soft, tender aura for intimate occasions' },
      { label: 'Daily ritual', value: 'original', description: 'Warm, signature scent that becomes part of you' },
    ],
  },
  {
    id: 4,
    question: 'WHAT TEXTURE SPEAKS TO YOU?',
    options: [
      { label: 'Warm & resinous', value: 'oud', description: 'Deep amber, rich balsams, lingering smoke' },
      { label: 'Soft & powdery', value: 'original', description: 'Velvety vanilla, skin-like musk, gentle warmth' },
      { label: 'Fresh & clean', value: 'musk', description: 'Bright citrus, clear air, effortless elegance' },
      { label: 'Deep & smoky', value: 'rose', description: 'Burning oud, dark resins, midnight intensity' },
    ],
  },
  {
    id: 5,
    question: 'WHO IS THIS SCENT FOR?',
    options: [
      { label: 'Myself', value: 'original', description: 'A personal signature, my daily armor' },
      { label: 'A gift', value: 'rose', description: 'Something precious for someone special' },
      { label: 'Shared moments', value: 'musk', description: 'A scent for connection and closeness' },
      { label: 'Someone special', value: 'oud', description: 'An intimate gesture, never forgotten' },
    ],
  },
];

export function getLocalProductById(id: string): Scent | undefined {
  return LOCAL_PRODUCTS.find((p) => p.id === id);
}

export function getLocalRelatedProducts(currentId: string): Scent[] {
  return LOCAL_PRODUCTS.filter((p) => p.id !== currentId && p.id !== 'giftset').slice(0, 3);
}

export function getQuizResult(answers: string[]): Scent | undefined {
  const counts: Record<string, number> = {};
  answers.forEach((a) => {
    const key = a.toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
  });

  const scentOrder = ['oud', 'rose', 'musk', 'original'];
  let winner = scentOrder.reduce((best, scent) => {
    if (!best || (counts[scent] || 0) > (counts[best] || 0)) return scent;
    return best;
  }, '' as string);

  if (!winner) winner = 'original';
  return LOCAL_PRODUCTS.find((p) => p.id === winner);
}

export function getLocalImageForProduct(nameOrId: string): string | undefined {
  const normalized = nameOrId.toLowerCase();
  const match = LOCAL_PRODUCTS.find(
    (p) =>
      p.id.toLowerCase() === normalized ||
      p.name.toLowerCase().includes(normalized) ||
      normalized.includes(p.id.toLowerCase())
  );
  return match?.image;
}
