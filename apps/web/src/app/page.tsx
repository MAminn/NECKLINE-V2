'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Scent } from '../types/nickline';
import { useCart } from '../hooks/useCart';
import { apiClient } from '../lib/api';
import { mapProductToScent, LocalProduct } from '../lib/mapProductToScent';
import { LOCAL_PRODUCTS } from '../data/products';
import { useToast } from '../contexts/ToastContext';

const Features = dynamic(() => import('../components/nickline/Features'));
const Collection = dynamic(() => import('../components/nickline/Collection'));
const Reviews = dynamic(() => import('../components/nickline/Reviews'));
const Footer = dynamic(() => import('../components/nickline/Footer'));
const ScentQuiz = dynamic(() => import('../components/nickline/ScentQuiz'), { ssr: false });

interface CatalogResponse {
  data: LocalProduct[];
}

export default function LandingPage() {
  const { addItem } = useCart();
  const { addToast } = useToast();
  const [scentsList, setScentsList] = useState<Scent[]>(LOCAL_PRODUCTS);
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const catalog: CatalogResponse = await apiClient('/products?limit=12&sort=newest');
        if (catalog.data?.length > 0) {
          setScentsList(catalog.data.map(mapProductToScent));
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      }
    }
    fetchData();
  }, []);

  const handleAddToCart = async (scent: Scent, quantity: number = 1) => {
    try {
      await addItem(scent.id, quantity);
      addToast(`${scent.name} added to your bag`, { type: 'brand', sub: scent.subtitle });
    } catch {
      addToast('Could not add to your bag. Please try again.', { type: 'error' });
    }
  };

  return (
    <div
      className="min-h-screen transition-all duration-500 overflow-x-hidden dark bg-noir text-warm-white selection:bg-crimson selection:text-warm-white"
      id="neckline-luxury-app"
    >
      <Features />

      <Collection
        onOpenQuiz={() => setIsQuizOpen(true)}
        scents={scentsList}
      />

      <Reviews />

      <Footer />

      <ScentQuiz
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onAddToCart={handleAddToCart}
        scents={scentsList}
      />
    </div>
  );
}
