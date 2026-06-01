import { notFound } from 'next/navigation';
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
  params: { id: string };
}

export default async function ProductDetailPage({ params }: Props) {
  const data = await getProduct(params.id);
  if (!data) notFound();

  const { product, related } = data;
  const isOutOfStock = product.stockOnHand <= 0;

  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-container px-4 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-text-tertiary">
          <span className="hover:text-text-secondary cursor-pointer">Home</span>
          <span className="mx-2">/</span>
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
