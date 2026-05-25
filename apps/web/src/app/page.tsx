'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import ProductGrid from '../components/ProductGrid';
import Pagination from '../components/Pagination';

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

export default function Home() {
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
      <section className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="font-display text-5xl uppercase tracking-wide text-primary sm:text-6xl md:text-7xl">
          NECKLINE
        </h1>
        <p className="mt-4 max-w-xl text-lg text-text-secondary">
          A concentrated solid fragrance that melts with your pulse points.
        </p>
        <div className="mt-6 flex gap-3">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <div className="h-3 w-3 rounded-full bg-surface" />
          <div className="h-3 w-3 rounded-full bg-surface-elevated" />
        </div>
      </section>

      {/* Catalog */}
      <section className="mx-auto max-w-container px-4 pb-24">
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

        {loading && (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        )}

        {error && (
          <div className="flex min-h-[400px] items-center justify-center">
            <p className="text-error">{error}</p>
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
