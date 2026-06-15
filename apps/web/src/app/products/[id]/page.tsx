'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Minus, Plus, Heart, Check, Target, Flame, Wind } from 'lucide-react';
import { useCart } from '../../../hooks/useCart';
import { useToast } from '../../../contexts/ToastContext';
import { apiClient } from '../../../lib/api';
import { getLocalProductById, getLocalRelatedProducts } from '../../../data/products';
import { Scent } from '../../../types/nickline';
import AuroraBackground from '../../../components/AuroraBackground';
import ProductCard from '../../../components/nickline/ProductCard';
import { easeOutExpo } from '../../../lib/motion';
import { getScentColor } from '../../../lib/scent';
import { formatPrice } from '../../../lib/formatPrice';

const howToWearSteps = [
  { icon: Target, title: 'Apply to pulse points', desc: 'Neck, wrists, collarbone' },
  { icon: Flame, title: 'Body heat activates', desc: 'Melts on contact with skin' },
  { icon: Wind, title: 'Scent evolves', desc: 'Intimate trail, hours long' },
];

const MAX_QUANTITY = 10;

interface ApiProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stockOnHand: number;
  images: string[];
  category: string;
  tags: string[];
}

interface ProductResponse {
  product: ApiProduct;
  related: ApiProduct[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { addToast } = useToast();
  const id = typeof params.id === 'string' ? params.id : '';

  const [product, setProduct] = useState<Scent | null>(null);
  const [related, setRelated] = useState<Scent[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    // Show local product immediately for instant render, then refresh from API
    const local = getLocalProductById(id);
    if (local) {
      setProduct(local);
      setRelated(getLocalRelatedProducts(id));
      setLoading(false);
    }

    async function fetchProduct() {
      try {
        const data: ProductResponse = await apiClient(`/products/${id}`);
        if (!data.product) return;
        const local = getLocalProductById(id);
        const image =
          data.product.images?.[0] && !data.product.images[0].includes('placeholder')
            ? data.product.images[0]
            : local?.image || '/images/product.jpg';
        const scent: Scent = {
          id: data.product._id,
          name: local?.name || data.product.name,
          subtitle: local?.subtitle || data.product.description?.substring(0, 60) || 'Solid Perfume',
          description: local?.description || data.product.description,
          price: data.product.price,
          currency: data.product.currency,
          image,
          tag: data.product.tags?.[0] || local?.tag,
          category: local?.category || data.product.category,
        };
        setProduct(scent);
        setRelated(
          data.related?.length
            ? data.related
                .filter((p) => p._id !== id)
                .slice(0, 3)
                .map((p) => {
                  const l = getLocalProductById(p._id);
                  const img =
                    p.images?.[0] && !p.images[0].includes('placeholder') ? p.images[0] : l?.image || '/images/product.jpg';
                  return {
                    id: p._id,
                    name: l?.name || p.name,
                    subtitle: l?.subtitle || p.description?.substring(0, 60) || 'Solid Perfume',
                    description: l?.description || p.description,
                    price: p.price,
                    currency: p.currency,
                    image: img,
                    tag: p.tags?.[0] || l?.tag,
                    category: l?.category || p.category,
                  };
                })
            : getLocalRelatedProducts(id)
        );
        setLoading(false);
      } catch {
        // keep local product already shown
      }
    }
    fetchProduct();
  }, [id]);

  useEffect(() => {
    setQuantity(1);
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-noir-deep flex items-center justify-center">
        <div className="text-center text-muted">Loading product…</div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-noir-deep">
        <div className="text-center">
          <h1 className="font-display font-bold text-2xl text-warm-white mb-4">Product not found</h1>
          <Link href="/shop" className="text-crimson hover:underline">
            Back to shop
          </Link>
        </div>
      </main>
    );
  }

  const scentColor = getScentColor(product.id);
  const inStock = true;

  const handleAddToCart = () => {
    addItem(product.id, quantity).then(() => {
      addToast(`${quantity > 1 ? `${quantity}× ` : ''}${product.name} added to your bag`, {
        type: 'brand',
        sub: product.subtitle,
      });
    });
  };

  return (
    <main className="min-h-screen bg-noir-deep">
      <AuroraBackground variant="subtle" />

      {/* Breadcrumb */}
      <div className="relative z-10 pt-24 pb-4">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Link href="/" className="hover:text-warm-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-warm-white transition-colors">
              Shop
            </Link>
            <span>/</span>
            <span className="text-warm-white">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Layout */}
      <section className="relative z-10 py-8 md:py-16">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            {/* Left: Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: easeOutExpo }}
              className="relative"
            >
              <div
                className="absolute inset-0 rounded-lg opacity-10"
                style={{
                  background: `radial-gradient(circle at 50% 80%, ${scentColor} 0%, transparent 60%)`,
                }}
              />
              <img
                src={product.image}
                alt={product.name}
                className="relative w-full aspect-square object-cover rounded-lg"
              />
            </motion.div>

            {/* Right: Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: easeOutExpo }}
              className="flex flex-col"
            >
              <span className="text-overline text-muted mb-3">{product.category}</span>
              <h1 className="font-display font-semibold text-2xl md:text-3xl text-warm-white mb-4 leading-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <span className="font-mono text-xl text-warm-white">
                  {formatPrice(product.price, product.currency)}
                </span>
                {inStock && (
                  <span className="flex items-center gap-1.5 text-xs text-success font-display tracking-wider uppercase">
                    <Check size={14} />
                    IN STOCK
                  </span>
                )}
              </div>
              <p className="text-base text-muted leading-relaxed mb-6">{product.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {(product.tag ? [product.tag] : []).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 border border-glass-border rounded-full text-xs text-muted font-display tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs text-muted uppercase tracking-wider font-display">Quantity</span>
                <div className="flex items-center border border-glass-border rounded-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-muted hover:text-warm-white transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 h-10 flex items-center justify-center font-mono text-sm text-warm-white border-x border-glass-border">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(MAX_QUANTITY, quantity + 1))}
                    disabled={quantity >= MAX_QUANTITY}
                    className="w-10 h-10 flex items-center justify-center text-muted hover:text-warm-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-muted"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Add to cart */}
              <button
                onClick={handleAddToCart}
                className="w-full h-14 bg-crimson text-warm-white font-display font-semibold text-sm tracking-[0.12em] uppercase rounded-sm hover:bg-crimson-light transition-colors mb-4 active:scale-[0.99]"
              >
                ADD TO CART — {formatPrice(product.price * quantity, product.currency)}
              </button>

              {/* Wishlist */}
              <button
                onClick={() => setWishlisted(!wishlisted)}
                className={`flex items-center justify-center gap-2 h-10 text-xs font-display tracking-wider uppercase transition-colors ${
                  wishlisted ? 'text-crimson' : 'text-muted hover:text-warm-white'
                }`}
              >
                <Heart size={16} className={wishlisted ? 'fill-crimson' : ''} />
                {wishlisted ? 'SAVED TO WISHLIST' : 'ADD TO WISHLIST'}
              </button>

              {/* How to Wear card */}
              <div className="mt-8 glass-card rounded-lg p-5">
                <h4 className="font-display font-medium text-xs tracking-[0.08em] text-warm-white uppercase mb-4">
                  HOW TO WEAR IT
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {howToWearSteps.map((step) => (
                    <div key={step.title} className="text-center">
                      <div className="w-10 h-10 rounded-full bg-crimson/10 flex items-center justify-center mx-auto mb-2">
                        <step.icon size={16} className="text-crimson" />
                      </div>
                      <span className="text-xs text-warm-white block mb-0.5">{step.title}</span>
                      <span className="text-[10px] text-muted">{step.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Related products */}
      <section className="relative z-10 py-16 border-t border-glass-border">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <h2 className="font-display font-semibold text-xl text-warm-white mb-8">YOU MIGHT ALSO LOVE</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
