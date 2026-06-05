'use client';

import { useState, useEffect, FormEvent } from 'react';
import dynamic from 'next/dynamic';
import { Scent, HeaderSlide } from '../types/nickline';
import { useCart } from '../hooks/useCart';
import { apiClient } from '../lib/api';
import { mapProductToScent, LocalProduct } from '../lib/mapProductToScent';
import Features from '../components/nickline/Features';
import HowToApply from '../components/nickline/HowToApply';
import QuoteBanner from '../components/nickline/QuoteBanner';
import { Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

const Hero = dynamic(() => import('../components/nickline/Hero'));
const Collection = dynamic(() => import('../components/nickline/Collection'));
const Reviews = dynamic(() => import('../components/nickline/Reviews'));

const ScentQuiz = dynamic(() => import('../components/nickline/ScentQuiz'), { ssr: false });
const ShopPage = dynamic(() => import('../components/nickline/ShopPage'), { ssr: false });
const ProductPage = dynamic(() => import('../components/nickline/ProductPage'), { ssr: false });

import { useToast } from '../contexts/ToastContext';

interface CatalogResponse {
  data: LocalProduct[];
}

export default function LandingPage() {
  const { addItem } = useCart();
  const { addToast } = useToast();
  const [scentsList, setScentsList] = useState<Scent[]>([]);
  const [headerSlides, setHeaderSlides] = useState<HeaderSlide[]>([]);
  const [howToApplyConfig, setHowToApplyConfig] = useState<{ color: string; steps: any[] }>({
    color: '#D21B27',
    steps: [],
  });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [view, setView] = useState<'home' | 'shop' | 'product'>('home');
  const [activeProduct, setActiveProduct] = useState<Scent | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  const heroImage = '/images/neckline_hero_panoramic_1779647796500.png';

  useEffect(() => {
    async function fetchData() {
      try {
        const catalog: CatalogResponse = await apiClient('/products?limit=12&sort=newest');
        setScentsList(catalog.data.map(mapProductToScent));
      } catch (err) {
        console.error('Failed to load products:', err);
      }

      try {
        const slidesRes = await fetch('/api/header-slides');
        if (slidesRes.ok) {
          const slides = await slidesRes.json();
          setHeaderSlides(slides);
        }
      } catch {
        // fallback: empty slides
      }

      try {
        const applyRes = await fetch('/api/how-to-apply');
        if (applyRes.ok) {
          const config = await applyRes.json();
          setHowToApplyConfig(config);
        }
      } catch {
        // fallback: defaults
      }
    }
    fetchData();
  }, []);

  const handleAddToCart = (scent: Scent, quantity: number = 1) => {
    addItem(scent.id, quantity);
    addToast(`${scent.name} added to your bag`, { type: 'brand', sub: scent.subtitle });
  };

  const handleOpenProduct = (scent: Scent) => {
    setActiveProduct(scent);
    setView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterJoin = (e: FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSuccess(true);
    setNewsletterEmail('');
    setTimeout(() => setNewsletterSuccess(false), 3000);
  };

  return (
    <div
      className="min-h-screen transition-all duration-500 overflow-x-hidden dark bg-[#070606] text-stone-100 selection:bg-[#D21B27] selection:text-white"
      id="neckline-luxury-app"
    >
      {/* Dynamic ambient pulse active overlay */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#D21B27] z-50 shadow-sm" />

      {view === 'home' ? (
        <>
          <Hero
            onScrollToSection={(sectionId) => {
              if (sectionId === 'collection' || sectionId === 'shop') {
                setView('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                const el = document.getElementById(sectionId);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            onOpenQuiz={() => setIsQuizOpen(true)}
            heroImage={heroImage}
            slides={headerSlides}
          />

          <Features />

          <Collection
            onAddToCart={handleAddToCart}
            onOpenQuiz={() => setIsQuizOpen(true)}
            scents={scentsList}
            onOpenShop={() => setView('shop')}
            onOpenProduct={handleOpenProduct}
          />

          <HowToApply config={howToApplyConfig} />

          <QuoteBanner heroImage={heroImage} />

          <Reviews />
        </>
      ) : view === 'shop' ? (
        <ShopPage
          onAddToCart={handleAddToCart}
          onBackToHome={() => setView('home')}
          scents={scentsList}
          onOpenProduct={handleOpenProduct}
        />
      ) : (
        activeProduct && (
          <ProductPage
            scent={activeProduct}
            onAddToCart={handleAddToCart}
            onBack={() => setView('shop')}
            suggestedScents={scentsList.filter((s) => s.id !== activeProduct.id)}
            onOpenProduct={handleOpenProduct}
          />
        )
      )}

      <ScentQuiz
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onAddToCart={handleAddToCart}
        scents={scentsList}
      />

      {/* Footer */}
      <footer
        className="border-t border-neutral-200 dark:border-zinc-900 py-16 dark:bg-[#070606] light:bg-stone-50 select-none text-left"
        id="footer-section"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4 space-y-4">
            <span className="text-lg font-serif tracking-[0.25em] text-[#D21B27] uppercase block font-semibold">
              ✦ NECKLINE
            </span>
            <p className="text-xs dark:text-neutral-400 light:text-stone-600 font-light leading-relaxed max-w-sm">
              We design solid fragrances carefully engineered for intimacy, warmth, and close
              exploration. Felt, never sprayed. Responsibly made with skin-safe formulas.
            </p>
            <div className="flex items-center gap-2 pt-2 text-[#D21B27] text-xs font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>Certified Intimacy Laboratory, 2026</span>
            </div>
          </div>

          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs tracking-[0.2em] font-serif font-bold dark:text-stone-300 light:text-stone-800 uppercase">
              Fragrance Exploration
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-light">
              <button
                onClick={() => setView('shop')}
                className="hover:text-[#D21B27] cursor-pointer transition-colors text-left py-1 dark:text-neutral-400 light:text-stone-600"
              >
                Cairo (Spicy)
              </button>
              <button
                onClick={() => setView('shop')}
                className="hover:text-[#D21B27] cursor-pointer transition-colors text-left py-1 dark:text-neutral-400 light:text-stone-600"
              >
                Midnight (Musk)
              </button>
              <button
                onClick={() => setView('shop')}
                className="hover:text-[#D21B27] cursor-pointer transition-colors text-left py-1 dark:text-neutral-400 light:text-stone-600"
              >
                Velvet (Floral)
              </button>
              <button
                onClick={() => setView('shop')}
                className="hover:text-[#D21B27] cursor-pointer transition-colors text-left py-1 dark:text-neutral-400 light:text-stone-600"
              >
                Ember (Smoky)
              </button>
            </div>
          </div>

          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs tracking-[0.2em] font-serif font-bold dark:text-stone-300 light:text-stone-800 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D21B27]" /> Join the aura list
            </h4>
            <p className="text-xs dark:text-neutral-400 light:text-stone-600 font-light leading-relaxed">
              Unlock exclusive early access scent releases, ritual guides, and private member offers.
            </p>

            {newsletterSuccess ? (
              <div className="text-xs text-[#D21B27] font-serif tracking-wider font-semibold py-2 animate-fade-in">
                Welcome to the Aura circle. Scent details sent.
              </div>
            ) : (
              <form
                onSubmit={handleNewsletterJoin}
                className="relative flex items-center border-b dark:border-zinc-800 light:border-stone-300 pb-1.5"
              >
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-transparent text-xs outline-none w-full dark:text-white light:text-black py-1 font-light"
                />
                <button
                  type="submit"
                  className="p-1 text-[#D21B27] hover:text-[#B0151E] transition-colors cursor-pointer"
                  title="Subscribe"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-neutral-100 dark:border-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] dark:text-neutral-500 light:text-stone-400 font-mono tracking-wider">
          <p>© 2026 NECKLINE Solid Perfume. All Rights Reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-stone-100 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-stone-100 cursor-pointer">Terms of Ritual</span>
            <span className="hover:text-stone-100 cursor-pointer">Traceability</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
