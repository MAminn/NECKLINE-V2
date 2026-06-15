/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { motion } from 'framer-motion';
import { Plus, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Scent } from '../../types/nickline';
import { useCart } from '../../hooks/useCart';
import { useToast } from '../../contexts/ToastContext';
import { formatPrice } from '../../lib/formatPrice';

interface ProductCardProps {
  product: Scent;
  index?: number;
  featured?: boolean;
}

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

function getScentColor(scentId: string): string {
  const map: Record<string, string> = {
    oud: '#C87941',
    rose: '#C97B7B',
    musk: '#9BA4A9',
    original: '#B8A88A',
    giftset: '#B8A88A',
  };
  return map[scentId.toLowerCase()] || '#DC2626';
}

export default function ProductCard({ product, index = 0, featured = false }: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { addToast } = useToast();
  const scentColor = getScentColor(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product.id, 1)
      .then(() => {
        addToast(`${product.name} added to your bag`, {
          type: 'brand',
          sub: product.subtitle,
        });
      })
      .catch(() => {
        addToast('Could not add to your bag. Please try again.', { type: 'error' });
      });
  };

  const handleCardClick = () => {
    router.push(`/products/${product.id}`);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  const cardClasses = featured
    ? 'group relative overflow-hidden rounded-md transition-shadow duration-300 bg-glass-surface backdrop-blur-md border border-glass-border hover:shadow-card-hover md:col-span-2 md:flex md:flex-row'
    : 'group relative overflow-hidden rounded-md transition-shadow duration-300 bg-glass-surface backdrop-blur-md border border-glass-border hover:shadow-card-hover';

  const imageWrapperClasses = featured
    ? 'relative overflow-hidden md:w-1/2 aspect-[4/3] md:aspect-auto'
    : 'relative overflow-hidden aspect-[4/5]';

  const bodyClasses = featured
    ? 'relative p-6 flex flex-col md:w-1/2 md:justify-center'
    : 'relative p-6 flex flex-col';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: easeOutExpo }}
      whileHover={{ y: -8 }}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role="link"
      tabIndex={0}
      className={cardClasses}
      style={{ cursor: 'pointer' }}
    >
      {/* Aura glow behind image */}
      <div
        className="absolute inset-0 opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 80%, ${scentColor} 0%, transparent 60%)`,
        }}
      />

      {/* Image area */}
      <div className={imageWrapperClasses}>
        {/* Scent aura bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] z-10"
          style={{
            background: `linear-gradient(to bottom, ${scentColor}, transparent)`,
          }}
        />
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        {/* Quick add overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={handleAdd}
            className="w-12 h-12 rounded-full glass-card-strong flex items-center justify-center text-warm-white hover:bg-crimson transition-colors duration-200"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag size={18} />
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className={bodyClasses}>
        <span className="text-overline text-muted mb-2">{product.category || 'SOLID PERFUME'}</span>
        <h3 className="font-display font-semibold text-lg text-warm-white mb-2 leading-tight">
          {product.name}
        </h3>
        <p className="text-sm text-muted line-clamp-2 mb-4">{product.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <span className="font-mono text-base text-warm-white">
            {formatPrice(product.price, product.currency)}
          </span>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 h-10 px-5 bg-crimson text-warm-white font-display font-semibold text-sm tracking-[0.12em] uppercase rounded-sm hover:bg-crimson-light transition-colors duration-200 active:scale-[0.97]"
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus size={16} />
            ADD
          </button>
        </div>
        {featured && (
          <span className="absolute top-4 right-4 text-xs font-mono text-crimson bg-crimson/10 px-3 py-1 rounded-full">
            SAVE 15%
          </span>
        )}
      </div>
    </motion.div>
  );
}
