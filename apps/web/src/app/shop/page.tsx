'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import ProductGrid from '../../components/ProductGrid';
import ProductSkeleton from '../../components/ProductSkeleton';
import Pagination from '../../components/Pagination';

interface Product {
  _id: string;
  name: string;
  price: number;
  currency: string;
  stockOnHand: number;
  images: string[];
  category: string;
}

interface CatalogResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ShopPage() {
  const [result, setResult] = useState<CatalogResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiClient(`/products?page=${page}&limit=12&sort=newest`);
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [page]);

  return (
    <main className="min-h-screen bg-bg">
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] w-full overflow-hidden">
        <img
          src="/images/hero.png"
          alt="NECKLINE Solid Perfume"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 text-center">
          <h1 className="font-display text-5xl uppercase tracking-wider text-text-primary sm:text-6xl md:text-7xl">
            NECKLINE
          </h1>
          <p className="mt-3 max-w-xl text-lg text-text-secondary">
            A concentrated solid fragrance that melts with your pulse points.
          </p>
        </div>
      </section>

      {/* Catalog */}
      <section className="mx-auto max-w-container px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-display text-2xl uppercase tracking-wide text-text-primary">
            The Collection
          </h2>
          {result && (
            <span className="text-sm text-text-tertiary">
              {result.pagination.total} products
            </span>
          )}
        </div>

        {/* Skeleton grid while loading */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="flex min-h-[400px] items-center justify-center">
            <p className="text-sm text-text-tertiary">{error}</p>
          </div>
        )}

        {!loading && !error && result && (
          <>
            <ProductGrid products={result.data} />
            <div className="mt-12">
              <Pagination
                page={result.pagination.page}
                totalPages={result.pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
