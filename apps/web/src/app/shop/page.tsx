'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
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

const AUDIENCE_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Men', value: 'men' },
  { label: 'Women', value: 'women' },
];

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Name: A to Z', value: 'name_asc' },
];

export default function ShopPage() {
  const [result, setResult] = useState<CatalogResponse | null>(null);
  const [page, setPage] = useState(1);
  const [audience, setAudience] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [audience, sort]);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '12', sort });
        if (audience) params.set('tags', audience);
        const data = await apiClient(`/products?${params.toString()}`);
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [page, audience, sort]);

  return (
    <main className="min-h-screen bg-bg">
      {/* Hero */}
      <section className="relative h-[48vh] min-h-[340px] w-full overflow-hidden">
        <img
          src="/images/hero.png"
          alt="NECKLINE Solid Perfume"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-start justify-end px-4 sm:px-6 lg:px-8 pb-12 max-w-container mx-auto w-full">
          <h3 className="t-eyebrow text-primary mb-3">Shop The Collection</h3>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl t-display text-white leading-none">
            Solid Perfume
          </h1>
          <p className="mt-4 max-w-lg text-sm sm:text-base text-text-secondary font-light">
            A concentrated solid fragrance that melts with your pulse points.
          </p>
        </div>
      </section>

      {/* Catalog */}
      <section className="mx-auto max-w-container px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Filter & sort row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-border pb-6 mb-10">
          {/* Audience category filters */}
          <div className="flex items-center gap-2" id="shop-audience-filters">
            {AUDIENCE_FILTERS.map((filter) => {
              const isActive = audience === filter.value;
              return (
                <button
                  key={filter.value}
                  onClick={() => setAudience(filter.value)}
                  className={`px-4 py-2 text-xs uppercase tracking-[0.16em] font-semibold rounded-full border transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? 'border-primary text-text-primary bg-primary/10'
                      : 'border-border text-text-tertiary hover:text-text-primary hover:border-border-strong'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Sort + result count */}
          <div className="flex items-center gap-4">
            {result && (
              <span className="text-xs text-text-tertiary font-mono tracking-wider whitespace-nowrap">
                {result.pagination.total} products
              </span>
            )}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none border border-border bg-surface-input text-text-primary text-xs uppercase tracking-[0.16em] font-semibold pl-4 pr-9 py-2 rounded-full cursor-pointer focus:outline-none focus:border-primary"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary pointer-events-none" />
            </div>
          </div>
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
