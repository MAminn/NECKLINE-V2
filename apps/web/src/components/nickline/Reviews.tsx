/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { Review } from '../../types/nickline';
import { LOCAL_REVIEWS } from '../../data/products';
import { easeOutExpo } from '../../lib/motion';

interface ReviewsProps {
  reviews?: Review[];
}

export default function Reviews({ reviews: reviewsProp }: ReviewsProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch('/api/testimonials');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setReviewsList(data);
            return;
          }
        }
      } catch {
        // fall through to local reviews
      }
      setReviewsList(LOCAL_REVIEWS);
    }
    fetchReviews();
  }, []);

  const reviews = reviewsProp && reviewsProp.length > 0 ? reviewsProp : reviewsList;

  const next = useCallback(() => {
    if (reviews.length === 0) return;
    setDirection(1);
    setCurrent((prev) => (prev + 1) % reviews.length);
  }, [reviews.length]);

  useEffect(() => {
    if (reviews.length === 0) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, reviews.length]);

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const visibleReviews = [];
  if (reviews.length > 0) {
    for (let i = 0; i < 3; i++) {
      visibleReviews.push(reviews[(current + i) % reviews.length]);
    }
  }

  if (reviews.length === 0) {
    return (
      <section id="reviews" className="py-24 md:py-32 bg-noir-lift">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 text-center">
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl tracking-[-0.02em] text-warm-white uppercase mb-4">
            LOVED BY THOUSANDS
          </h2>
        </div>
      </section>
    );
  }

  return (
    <section id="reviews" className="py-24 md:py-32 bg-noir-lift">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: easeOutExpo }}
          className="text-center mb-12"
        >
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl tracking-[-0.02em] text-warm-white uppercase mb-4">
            LOVED BY THOUSANDS
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={18} className="text-crimson fill-crimson" />
              ))}
            </div>
            <span className="font-mono text-sm text-warm-white">4.9/5</span>
            <span className="text-xs text-muted">From 4,200+ Verified Buyers</span>
          </div>
        </motion.div>

        {/* Review cards - desktop shows 3, mobile shows 1 */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 mb-8">
          <AnimatePresence mode="popLayout" custom={direction}>
            {visibleReviews.map((review, i) => (
              <motion.div
                key={review.id}
                layout
                custom={direction}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: easeOutExpo }}
                className="glass-card rounded-lg p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} className="text-crimson fill-crimson" />
                  ))}
                </div>
                <p className="text-sm text-warm-white/90 italic leading-relaxed mb-4">
                  &ldquo;{review.comment}&rdquo;
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">— {review.name}, Verified Buyer</span>
                  <span className="text-xs text-crimson bg-crimson/10 px-3 py-1 rounded-full">
                    {review.product}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Mobile: single card */}
        <div className="md:hidden mb-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={reviews[current].id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -50 }}
              transition={{ duration: 0.4, ease: easeOutExpo }}
              className="glass-card rounded-lg p-6"
            >
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} className="text-crimson fill-crimson" />
                ))}
              </div>
              <p className="text-sm text-warm-white/90 italic leading-relaxed mb-4">
                &ldquo;{reviews[current].comment}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">— {reviews[current].name}, Verified Buyer</span>
                <span className="text-xs text-crimson bg-crimson/10 px-3 py-1 rounded-full">
                  {reviews[current].product}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === current ? 'bg-crimson w-6' : 'bg-muted/30 hover:bg-muted/50'
              }`}
              aria-label={`Go to review ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
