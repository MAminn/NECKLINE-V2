import { Scent } from '../types/nickline';
import { LOCAL_PRODUCTS, getLocalImageForProduct } from '../data/products';

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

function deriveScentId(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('oud')) return 'oud';
  if (n.includes('rose')) return 'rose';
  if (n.includes('musk')) return 'musk';
  if (n.includes('original')) return 'original';
  if (n.includes('gift') || n.includes('collection')) return 'giftset';
  return '';
}

export function mapProductToScent(product: LocalProduct): Scent {
  const scentId = deriveScentId(product.name);
  const local = scentId ? LOCAL_PRODUCTS.find((p) => p.id === scentId) : undefined;
  const fallbackImage = getLocalImageForProduct(product.name) || '/images/product.jpg';

  return {
    id: product._id,
    name: local?.name || product.name,
    subtitle: local?.subtitle || product.description?.substring(0, 60) || 'Premium solid fragrance',
    description: local?.description || product.description || 'Premium solid fragrance',
    price: product.price,
    currency: product.currency,
    image: product.images?.[0] && !product.images[0].includes('placeholder') ? product.images[0] : fallbackImage,
    category: local?.category || product.category,
    tag: local?.tag || product.tags?.[0],
  };
}
