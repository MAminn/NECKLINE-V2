import { Scent } from '../types/nickline';

export interface LocalProduct {
  _id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  stockOnHand: number;
  images: string[];
  category: string;
  tags?: string[];
}

export function mapProductToScent(product: LocalProduct): Scent {
  return {
    id: product._id,
    name: product.name,
    subtitle: product.description?.substring(0, 60) || 'Premium solid fragrance',
    description: product.description || 'Premium solid fragrance',
    longDescription: product.description || 'Premium solid fragrance',
    price: product.price,
    currency: product.currency,
    image: product.images?.[0] || '/images/product.jpg',
    galleryImages: product.images?.length ? product.images : undefined,
    notes: { top: 'Spices', heart: 'Woods', base: 'Amber' },
    intensity: 4,
    vibe: 'Seductive atmosphere',
    ingredients: ['Natural oils', 'Beeswax'],
    category: product.category,
    tag: product.tags?.[0],
  };
}
