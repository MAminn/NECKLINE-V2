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
  const isLowStock = !isOutOfStock && product.stockOnHand <= 5;
  const imageUrl = product.images[0] || '/placeholder-product.png';

  return (
    <Link
      href={`/products/${product._id}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-glass-border bg-noir-lift transition-all duration-300
                 hover:border-crimson/35 hover:shadow-card-hover
                 hover:-translate-y-0.5"
    >
      {/* Image area */}
      <div className="relative aspect-square overflow-hidden bg-noir-lift">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />

        {/* Out-of-stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-noir/75 backdrop-blur-[2px]">
            <span className="rounded-sm bg-noir px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
              Sold Out
            </span>
          </div>
        )}

        {/* Low stock badge */}
        {isLowStock && (
          <span className="absolute left-3 top-3 rounded-sm bg-crimson/90 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-warm-white">
            Only {product.stockOnHand} left
          </span>
        )}
      </div>

      {/* Content area */}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          {product.category}
        </p>
        <h3 className="font-display text-base uppercase tracking-wide text-warm-white line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* Price + action row */}
        <div className="mt-auto flex items-center justify-between pt-3">
          <PriceDisplay amount={product.price} currency={product.currency} />
          {!isOutOfStock && (
            <div onClick={(e) => e.preventDefault()}>
              <AddToCartButton productId={product._id} quantity={1} />
            </div>
          )}
        </div>
      </div>

      {/* Hover accent line at bottom */}
      <span
        className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-crimson transition-transform duration-300 group-hover:scale-x-100"
        aria-hidden="true"
      />
    </Link>
  );
}
