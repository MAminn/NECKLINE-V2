"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { apiClient } from "../../lib/api";
import { mapProductToScent, LocalProduct } from "../../lib/mapProductToScent";
import { Scent } from "../../types/nickline";
import AuroraBackground from "../../components/AuroraBackground";
import ProductCard from "../../components/nickline/ProductCard";
import { easeOutExpo } from "../../lib/motion";

type FilterType = "all" | "men" | "women";
type SortType = "newest" | "price-low" | "price-high";

const filters: { label: string; value: FilterType }[] = [
  { label: "ALL", value: "all" },
  { label: "MEN", value: "men" },
  { label: "WOMEN", value: "women" },
];

const sortOptions: { label: string; value: SortType }[] = [
  { label: "NEWEST", value: "newest" },
  { label: "PRICE: LOW TO HIGH", value: "price-low" },
  { label: "PRICE: HIGH TO LOW", value: "price-high" },
];

// Stable keys for the fixed set of loading skeletons, so the list doesn't key
// off array indexes.
const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6"];

interface CatalogResponse {
  data: LocalProduct[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type CatalogStatus = "loading" | "error" | "loaded";

export default function ShopPage() {
  const [products, setProducts] = useState<Scent[]>([]);
  const [status, setStatus] = useState<CatalogStatus>("loading");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [sortOpen, setSortOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    setStatus("loading");
    try {
      const data: CatalogResponse = await apiClient(
        "/products?limit=24&sort=newest",
      );
      setProducts(data.data?.map(mapProductToScent) ?? []);
      setStatus("loaded");
    } catch (err) {
      console.error("Failed to load shop products:", err);
      setProducts([]);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const loading = status === "loading";

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (filter !== "all") {
      result = result.filter((p) => {
        const name = p.name.toLowerCase();
        if (filter === "women") return name.includes("rose");
        if (filter === "men") return name.includes("oud");
        return true;
      });
    }

    switch (sort) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }

    return result;
  }, [products, filter, sort]);

  return (
    <main className='min-h-screen bg-noir-deep'>
      {/* Shop Hero */}
      <section className='relative min-h-[50vh] flex items-center justify-center overflow-hidden bg-noir'>
        <AuroraBackground variant='subtle' />
        <div className='relative z-10 text-center px-6 pt-24'>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOutExpo }}
            className='text-overline text-crimson block mb-4'>
            SHOP THE COLLECTION
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: easeOutExpo }}
            className='text-display text-warm-white mb-4'>
            SOLID PERFUME
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: easeOutExpo }}
            className='text-base text-muted max-w-md mx-auto'>
            A concentrated solid fragrance that melts with your pulse points.
          </motion.p>
        </div>
      </section>

      {/* Filters Bar */}
      <div className='sticky top-[72px] z-40 bg-noir-lift/95 backdrop-blur-md border-b border-glass-border'>
        <div className='max-w-[1280px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between'>
          {/* Filter pills */}
          <div className='flex gap-2'>
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`h-9 px-5 rounded-full font-display font-medium text-xs tracking-wider transition-all duration-200 ${
                  filter === f.value
                    ? "bg-crimson text-noir"
                    : "border border-glass-border text-muted hover:text-warm-white hover:border-white/15"
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Product count + Sort */}
          <div className='flex items-center gap-4'>
            <span className='hidden sm:block font-mono text-xs text-muted'>
              {loading ? "…" : `${filteredProducts.length} products`}
            </span>
            <div className='relative'>
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className='flex items-center gap-2 h-9 px-4 border border-glass-border rounded-full font-display font-medium text-xs tracking-wider text-muted hover:text-warm-white transition-colors'>
                {sortOptions.find((o) => o.value === sort)?.label}
                <ChevronDown size={14} />
              </button>
              {sortOpen && (
                <>
                  <button
                    type='button'
                    aria-label='Close sort menu'
                    className='fixed inset-0 z-10 cursor-default'
                    onClick={() => setSortOpen(false)}
                  />
                  <div className='absolute right-0 top-full mt-2 w-48 bg-noir-lift border border-glass-border rounded-lg shadow-modal z-20 overflow-hidden'>
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSort(option.value);
                          setSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-xs font-display tracking-wider transition-colors ${
                          sort === option.value
                            ? "bg-crimson/10 text-crimson"
                            : "text-muted hover:text-warm-white hover:bg-white/5"
                        }`}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <section className='py-12 md:py-16'>
        <div className='max-w-[1280px] mx-auto px-6 md:px-10'>
          {status === "loading" && (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              {SKELETON_KEYS.map((key) => (
                <div
                  key={key}
                  className='aspect-[4/5] bg-glass-surface border border-glass-border rounded-md animate-pulse'
                />
              ))}
            </div>
          )}
          {status === "error" && (
            <div className='flex flex-col items-center justify-center text-center py-24 gap-6'>
              <p className='text-base text-muted'>
                Couldn&apos;t load products. Please try again.
              </p>
              <button
                type='button'
                onClick={fetchProducts}
                className='h-10 px-6 rounded-full bg-crimson text-noir font-display font-medium text-xs tracking-wider transition-all duration-200 hover:opacity-90'>
                Retry
              </button>
            </div>
          )}
          {status === "loaded" && products.length === 0 && (
            <div className='flex flex-col items-center justify-center text-center py-24'>
              <p className='text-base text-muted'>No products available yet.</p>
            </div>
          )}
          {status === "loaded" && products.length > 0 && (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filteredProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
