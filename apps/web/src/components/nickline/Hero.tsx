/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AuroraBackground from '../AuroraBackground';
import { easeOutExpo } from '../../lib/motion';
import type { AdminHeaderSlide } from '../../types/nickline';

interface HeroProps {
  onScrollToSection?: (sectionId: string) => void;
  heroImage?: string;
  slides?: AdminHeaderSlide[];
}

const DEFAULT_SLIDE: AdminHeaderSlide = {
  id: 'default',
  title: 'WEAR YOUR NECKLINE',
  subtitle: 'SOLID FRAGRANCE — DESIGNED FOR INTIMACY',
  description:
    "A concentrated solid perfume that melts with your body heat on your pulse points, leaving a trail that's close, personal, seductive, and unforgettable. Intimacy starts here.",
  buttonText: 'SHOP NOW',
  linkTo: 'shop',
  image: '',
  order: 0,
  active: true,
};

export default function Hero({ onScrollToSection, heroImage, slides = [] }: HeroProps) {
  const router = useRouter();
  const productRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const activeSlides = slides.length > 0 ? slides.filter((s) => s.active).sort((a, b) => a.order - b.order) : [];
  const hasSlides = activeSlides.length > 0;
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentSlide = hasSlides ? activeSlides[currentIndex] : DEFAULT_SLIDE;
  const slideImage = currentSlide.image || heroImage || '/images/hero-product.jpg';

  const nextSlide = useCallback(() => {
    if (!hasSlides || activeSlides.length <= 1) return;
    setCurrentIndex((i) => (i + 1) % activeSlides.length);
  }, [hasSlides, activeSlides.length]);

  const prevSlide = useCallback(() => {
    if (!hasSlides || activeSlides.length <= 1) return;
    setCurrentIndex((i) => (i - 1 + activeSlides.length) % activeSlides.length);
  }, [hasSlides, activeSlides.length]);

  useEffect(() => {
    if (!hasSlides || activeSlides.length <= 1) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [hasSlides, activeSlides.length, nextSlide]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!productRef.current) return;
      const rect = productRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = ((e.clientX - centerX) / rect.width) * 15;
      const y = ((e.clientY - centerY) / rect.height) * 15;
      setMousePos((prev) => ({
        x: prev.x + (x - prev.x) * 0.1,
        y: prev.y + (y - prev.y) * 0.1,
      }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleShopNow = () => {
    const target = currentSlide.linkTo || 'shop';
    if (onScrollToSection) {
      onScrollToSection(target);
    } else {
      if (target === 'shop' || target === 'collection') {
        router.push('/shop');
      } else {
        const el = document.getElementById(target);
        el ? el.scrollIntoView({ behavior: 'smooth' }) : router.push('/shop');
      }
    }
  };

  const handleRitual = () => {
    if (onScrollToSection) {
      onScrollToSection('ritual');
    } else {
      const el = document.getElementById('ritual');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const titleWords = currentSlide.title ? currentSlide.title.split(' ').filter(Boolean) : ['WEAR', 'YOUR', 'NECKLINE'];

  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden bg-noir">
      <AuroraBackground variant="hero" />

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 md:px-10 pt-24 pb-16">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-4">
          {/* Left content */}
          <div className="w-full md:w-[55%] md:pr-8">
            {/* Overline */}
            <AnimatePresence mode="wait">
              <motion.p
                key={`subtitle-${currentIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: easeOutExpo }}
                className="text-overline text-crimson mb-6"
              >
                {currentSlide.subtitle}
              </motion.p>
            </AnimatePresence>

            {/* Headline with word reveal */}
            <h1 className="text-display text-warm-white mb-6" aria-label={currentSlide.title}>
              {titleWords.map((word, wi) => (
                <span key={wi} className="inline-block overflow-hidden mr-[0.25em]">
                  <motion.span
                    className="inline-block"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.2 + wi * 0.12,
                      ease: easeOutExpo,
                    }}
                  >
                    {word}
                  </motion.span>
                </span>
              ))}
            </h1>

            {/* Subheadline */}
            <AnimatePresence mode="wait">
              <motion.p
                key={`desc-${currentIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, delay: 0.4, ease: easeOutExpo }}
                className="text-base text-muted leading-relaxed max-w-md mb-8"
              >
                {currentSlide.description}
              </motion.p>
            </AnimatePresence>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6, ease: easeOutExpo }}
              className="flex flex-wrap gap-4 mb-8"
            >
              <button onClick={handleShopNow} className="btn-primary">
                {currentSlide.buttonText || 'SHOP NOW'}
              </button>
              <button onClick={handleRitual} className="btn-ghost">
                OUR RITUAL
              </button>
            </motion.div>

            {/* Micro badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8, ease: easeOutExpo }}
              className="flex flex-wrap gap-6"
            >
              <span className="flex items-center gap-2 text-xs text-muted">
                <Sparkles size={14} className="text-crimson" />
                Sensory Skin Release
              </span>
              <span className="flex items-center gap-2 text-xs text-muted">
                <Flame size={14} className="text-crimson" />
                Pheromone Active
              </span>
            </motion.div>
          </div>

          {/* Right - Product image */}
          <div className="w-full md:w-[45%] flex items-center justify-center relative">
            <motion.div
              ref={productRef}
              initial={{ scale: 1.08, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.4, delay: 0.3, ease: 'easeOut' }}
              style={{
                transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
                transition: 'transform 0.3s ease-out',
              }}
              className="relative"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={`img-${currentIndex}`}
                  src={slideImage}
                  alt={currentSlide.title}
                  className="w-full max-w-[420px] h-auto rounded-lg object-cover"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.6, ease: easeOutExpo }}
                  style={{
                    boxShadow: '0 32px 64px rgba(0,0,0,0.6), 0 0 48px rgba(220,38,38,0.1)',
                  }}
                />
              </AnimatePresence>

              {/* Floating glass card */}
              <motion.div
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.0, ease: easeOutExpo }}
                className="absolute -bottom-6 -right-4 md:-right-8 glass-card rounded-lg p-4 max-w-[200px]"
                style={{ transform: 'rotate(-2deg)' }}
              >
                <span className="text-overline text-warm-white block mb-1">PULSE ACTIVATED</span>
                <span className="text-xs text-muted leading-relaxed">
                  Melts with your body heat for a lasting, intimate scent.
                </span>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Carousel controls */}
        {hasSlides && activeSlides.length > 1 && (
          <div className="absolute bottom-8 left-6 md:left-10 flex items-center gap-3 z-20">
            <button
              onClick={prevSlide}
              className="w-8 h-8 rounded-full border border-glass-border bg-noir/60 flex items-center justify-center text-warm-white hover:bg-crimson/20 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1.5">
              {activeSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className="w-2 h-2 rounded-full transition-colors"
                  style={{ background: i === currentIndex ? 'var(--crimson)' : 'rgba(255,255,255,0.3)' }}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={nextSlide}
              className="w-8 h-8 rounded-full border border-glass-border bg-noir/60 flex items-center justify-center text-warm-white hover:bg-crimson/20 transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="w-[2px] h-6 bg-warm-white/40 animate-scroll-pulse rounded-full" />
      </motion.div>
    </section>
  );
}
