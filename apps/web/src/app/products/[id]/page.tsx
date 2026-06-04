import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HeartPulse, Droplets, Wind } from 'lucide-react';
import ImageGallery from '../../../components/ImageGallery';
import PriceDisplay from '../../../components/PriceDisplay';
import ProductGrid from '../../../components/ProductGrid';
import ProductActions from '../../../components/ProductActions';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface ProductDetailResponse {
  product: {
    _id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    stockOnHand: number;
    images: string[];
    category: string;
    tags: string[];
  };
  related: {
    _id: string;
    name: string;
    price: number;
    currency: string;
    stockOnHand: number;
    images: string[];
    category: string;
  }[];
}

async function getProduct(id: string): Promise<ProductDetailResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getProduct(id);
  if (!data) notFound();

  const { product, related } = data;
  const isOutOfStock = product.stockOnHand <= 0;

  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-container px-4 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="transition-colors hover:text-text-secondary">Home</Link>
          <span>/</span>
          <Link href="/shop" className="transition-colors hover:text-text-secondary">Shop</Link>
          <span>/</span>
          <span className="text-text-secondary">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Gallery */}
          <ImageGallery images={product.images} productName={product.name} />

          {/* Info */}
          <div className="flex flex-col">
            <p className="text-xs uppercase tracking-wide text-text-tertiary">{product.category}</p>
            <h1 className="mt-2 font-display text-3xl uppercase tracking-wide text-text-primary sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4 flex items-center gap-3">
              <PriceDisplay amount={product.price} currency={product.currency} className="text-2xl" />
              {isOutOfStock ? (
                <span className="rounded-md bg-surface-elevated px-2 py-1 text-xs font-medium uppercase tracking-wide text-text-secondary">
                  Out of Stock
                </span>
              ) : (
                <span className="rounded-md bg-success-bg px-2 py-1 text-xs font-medium uppercase tracking-wide text-success-fg">
                  In Stock
                </span>
              )}
            </div>

            <p className="mt-6 leading-relaxed text-text-secondary">{product.description}</p>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wide text-text-tertiary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-8">
              <ProductActions productId={product._id} disabled={isOutOfStock} />
            </div>

            {isOutOfStock && (
              <p className="mt-4 text-sm text-text-muted">
                This item is currently unavailable. Check back soon.
              </p>
            )}

            {/* Solid fragrance ritual callout */}
            <div className="mt-8 rounded-lg border border-border bg-surface p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-text-muted">
                How to wear it
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <HeartPulse className="h-4 w-4 text-primary" strokeWidth={1.5} />, label: 'Apply to pulse points', sub: 'Neck, wrists, collarbone' },
                  { icon: <Droplets className="h-4 w-4 text-primary" strokeWidth={1.5} />, label: 'Body heat activates', sub: 'Melts on contact with skin' },
                  { icon: <Wind className="h-4 w-4 text-primary" strokeWidth={1.5} />, label: 'Scent evolves', sub: 'Intimate trail, hours long' },
                ].map((step, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 text-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border">
                      {step.icon}
                    </div>
                    <p className="text-xs font-medium text-text-secondary leading-tight">{step.label}</p>
                    <p className="text-[11px] text-text-muted leading-tight">{step.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-8 font-display text-2xl uppercase tracking-wide text-text-primary">
              You might also love
            </h2>
            <ProductGrid products={related} />
          </section>
        )}
      </div>
    </main>
  );
}
