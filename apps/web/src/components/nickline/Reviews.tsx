/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from "react";
import { apiClient } from "../../lib/api";
import { Review } from "../../types/nickline";
import { Star, Check, PenTool, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Reviews() {
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Form states
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [product, setProduct] = useState("CAIRO");
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Load reviews from API dynamic backend
  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/testimonials");
      if (res.ok) {
        const data = await res.json();
        setReviewsList(data);
      }
    } catch (err) {
      console.error("Failed to read reviews from live API endpoint:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    
    // Poll reviews occasionally to sync live with backend admin modifications
    const timer = setInterval(() => {
      fetchReviews();
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !comment) return;
    setSubmitError("");

    try {
      // Goes through apiClient (direct API origin) so the CSRF cookie +
      // x-csrf-token header travel with the request; the /api rewrite proxy
      // would drop the API-domain cookies.
      await apiClient("/testimonials", {
        method: "POST",
        body: JSON.stringify({
          name,
          rating,
          comment,
          product,
          verified: true
        })
      });

      setSuccess(true);
      setName("");
      setComment("");
      setRating(5);
      fetchReviews(); // immediately reload loop!

      setTimeout(() => {
        setSuccess(false);
        setShowForm(false);
      }, 2500);
    } catch (err) {
      console.error("Failed submitting review to live API:", err);
      setSubmitError(err instanceof Error ? err.message : "Failed to submit review");
    }
  };

  // Helper render of stars
  const renderStars = (count: number) => {
    return (
      <div className="flex items-center gap-0.5" aria-label={`${count} out of 5 stars`}>
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < count ? "text-primary fill-primary" : "text-text-disabled"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="py-12 select-none bg-bg overflow-hidden" id="reviews">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TOP INTRO */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-display font-medium tracking-[0.08em] uppercase text-text-primary">
            Loved By Thousands
          </h2>
          <div className="flex justify-center items-center gap-1 mt-3 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-primary fill-primary" />
            ))}
          </div>
          <p className="text-xs text-text-tertiary font-light tracking-wide font-mono">
            4.9/5 From 4,200+ Verified Buyers
          </p>
        </div>

        {/* REVIEWS SCROLLING MARQUEE CONTEXT */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-text-muted font-mono">
            Calibrating sensory feedback loop...
          </div>
        ) : reviewsList.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted font-mono">
            No aura reviews loaded. Write the first dynamic review!
          </div>
        ) : (
          <div className="relative w-full overflow-hidden py-4 mb-8 select-none" id="reviews-marquee-parent">
            {/* Edge feathering custom gradient overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-48 bg-gradient-to-r from-bg via-bg/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-48 bg-gradient-to-l from-bg via-bg/80 to-transparent z-10 pointer-events-none" />

            {/* Seamless Double-copied track */}
            <div className="animate-marquee flex gap-6" id="marquee-track">
              {/* First Track copy */}
              {reviewsList.map((rev) => (
                <div
                  key={`marq-1-${rev.id}`}
                  className="w-[280px] sm:w-[350px] flex-shrink-0 flex flex-col justify-between p-6 border text-left transition-colors duration-500 rounded-2xl relative
                    bg-white/[0.02] border-white/[0.05] hover:border-primary/30 hover:shadow-[0_15px_30px_rgba(210,27,39,0.06)] shadow-sm gpu-layer"
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      {renderStars(rev.rating)}
                      <span className="text-xs uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 font-bold font-serif shadow-sm">
                        {rev.product}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm italic font-light leading-relaxed text-text-secondary min-h-[70px]">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>

                  <div className="border-t border-border pt-4 mt-4 flex items-center justify-between">
                    <span className="text-xs font-serif font-medium text-text-primary">
                      — {rev.name}
                    </span>
                    
                    {rev.verified && (
                      <div className="flex items-center gap-1 text-xs text-primary font-bold tracking-wider font-mono">
                        <div className="w-3.5 h-3.5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        Verified
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Second Track copy (identical copy enabling seamless visual wrap) */}
              {reviewsList.map((rev) => (
                <div
                  key={`marq-2-${rev.id}`}
                  className="w-[280px] sm:w-[350px] flex-shrink-0 flex flex-col justify-between p-6 border text-left transition-colors duration-500 rounded-2xl relative
                    bg-white/[0.02] border-white/[0.05] hover:border-primary/30 hover:shadow-[0_15px_30px_rgba(210,27,39,0.06)] shadow-sm gpu-layer"
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      {renderStars(rev.rating)}
                      <span className="text-xs uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 font-bold font-serif shadow-sm">
                        {rev.product}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm italic font-light leading-relaxed text-text-secondary min-h-[70px]">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>

                  <div className="border-t border-border pt-4 mt-4 flex items-center justify-between">
                    <span className="text-xs font-serif font-medium text-text-primary">
                      — {rev.name}
                    </span>
                    
                    {rev.verified && (
                      <div className="flex items-center gap-1 text-xs text-primary font-bold tracking-wider font-mono">
                        <div className="w-3.5 h-3.5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        Verified
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TRIGGER BUTTONS */}
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-8 py-3 bg-primary hover:bg-primary-pressed text-white text-xs tracking-[0.2em] font-bold uppercase transition-transform hover:-translate-y-0.5 cursor-pointer rounded-none flex items-center gap-2 shadow-lg"
            id="btn-write-review"
          >
            <PenTool className="w-3.5 h-3.5" /> Write A Review
          </button>
        </div>

        {/* REVIEWS INPUT FORM */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-12 max-w-lg mx-auto overflow-hidden border p-6 md:p-8 rounded-2xl bg-surface-alt/95 border-white/[0.08]"
              id="write-review-drawer"
            >
              <h4 className="text-xl font-serif text-text-primary mb-6 uppercase tracking-wider text-left flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Share Your Sensory Review
              </h4>

              {success ? (
                <div className="py-12 text-center text-success font-mono font-medium text-xs">
                  Review submitted successfully! Your feedback melts with Neckline.
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4 text-left">
                  {submitError && (
                    <div className="p-3 bg-error-bg border border-error-border text-error-fg text-xs font-mono">
                      {submitError}
                    </div>
                  )}
                  <div>
                    <label className="text-xs tracking-wider font-mono text-text-tertiary uppercase block mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sandra L."
                      className="w-full bg-surface-input border border-border-strong p-3 text-xs text-white outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs tracking-wider font-mono text-text-tertiary uppercase block mb-1">Select Scent</label>
                      <select
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        className="w-full bg-surface-input border border-border-strong p-3 text-xs text-white outline-none focus:border-primary transition-colors"
                      >
                        <option value="CAIRO">CAIRO</option>
                        <option value="MIDNIGHT">MIDNIGHT</option>
                        <option value="VELVET">VELVET</option>
                        <option value="EMBER">EMBER</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs tracking-wider font-mono text-text-tertiary uppercase block mb-1">Sensory Rating</label>
                      <select
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="w-full bg-surface-input border border-border-strong p-3 text-xs text-white outline-none focus:border-primary transition-colors"
                      >
                        <option value={5}>5 Stars (Flawless)</option>
                        <option value={4}>4 Stars (Intoxicating)</option>
                        <option value={3}>3 Stars (Decent)</option>
                        <option value={2}>2 Stars (Faint)</option>
                        <option value={1}>1 Star (None)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs tracking-wider font-mono text-text-tertiary uppercase block mb-1">Fragrance Comment</label>
                    <textarea
                      required
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      placeholder="Describe the melt, skin performance, compliments..."
                      className="w-full bg-surface-input border border-border-strong p-3 text-xs text-white outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-primary hover:bg-primary-pressed text-white text-xs tracking-[0.2em] font-bold uppercase transition-colors duration-200 cursor-pointer"
                  >
                    Submit Review
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
