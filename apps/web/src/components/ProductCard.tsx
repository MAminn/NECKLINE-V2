'use client';

import Link from 'next/link';
import PriceDisplay from './PriceDisplay';
import AddToCartButton from './AddToCartButton';

interface Product {
  _id: string;
  name: string;
  price: number;
  currency: string;
  stockOnHand: number;
  images: string[];
  category: string;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.stockOnHand <= 0;
  const imageUrl = product.images[0] || '/placeholder-product.png';

  return (
    <Link
      href={`/products/${product._id}`}
      className="group relative flex flex-col overflow-hidden rounded-lg bg-surface transition-all duration-base hover:shadow-lg hover:scale-[1.02]"
    >
      <div className="relative aspect-square overflow-hidden bg-bg-secondary">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-slow group-hover:scale-105"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/70">
            <span className="rounded-md bg-surface-elevated px-3 py-1 text-sm font-medium uppercase tracking-wide text-text-secondary">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs uppercase tracking-wide text-text-tertiary">{product.category}</p>
        <h3 className="mt-1 font-display text-lg uppercase tracking-wide text-text-primary line-clamp-2">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-3">
          <PriceDisplay amount={product.price} currency={product.currency} />
          {!isOutOfStock && (
            <div onClick={(e) => e.preventDefault()}>
              <AddToCartButton productId={product._id} quantity={1} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
