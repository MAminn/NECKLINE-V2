/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';

const footerLinks = [
  { label: 'Cairo (Spicy)', filter: 'oud' },
  { label: 'Midnight (Musk)', filter: 'musk' },
  { label: 'Velvet (Floral)', filter: 'rose' },
  { label: 'Ember (Smoky)', filter: 'original' },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      // TODO: Persist the subscription via a backend newsletter API.
      // This currently only updates local UI state — the email is not stored anywhere.
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-noir border-t border-glass-border">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          {/* Left column */}
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <span className="text-crimson text-sm">&#9670;</span>
              <span className="font-display font-bold text-xl tracking-[-0.02em]">
                <span className="text-warm-white">NECK</span>
                <span className="text-crimson">LINE</span>
              </span>
            </Link>
            <p className="text-sm text-muted leading-relaxed max-w-sm mb-4">
              We design solid fragrances carefully engineered for intimacy, warmth, and close
              exploration. Felt, never sprayed. Responsibly made with skin-safe formulas.
            </p>
            <div className="flex items-center gap-2 text-muted-deep">
              <ShieldCheck size={14} />
              <span className="font-mono text-xs tracking-wider uppercase">Certified Intimacy Laboratory, 2026</span>
            </div>
          </div>

          {/* Center column */}
          <div className="md:col-span-3 md:col-start-6">
            <h4 className="font-display font-medium text-xs tracking-[0.08em] text-warm-white uppercase mb-6">
              FRAGRANCE EXPLORATION
            </h4>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.filter}>
                  <Link
                    href={`/products/${link.filter}`}
                    className="text-sm text-muted hover:text-warm-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Right column */}
          <div className="md:col-span-4">
            <h4 className="font-display font-medium text-xs tracking-[0.08em] text-warm-white uppercase mb-4">
              JOIN THE AURA LIST
            </h4>
            <p className="text-sm text-muted mb-4">
              Unlock exclusive early access to scent releases, ritual guides, and private member offers.
            </p>
            {subscribed ? (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-success flex items-center gap-2"
              >
                You&apos;re on the list ✓
              </motion.p>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 h-11 px-4 bg-white/5 border border-glass-border rounded-full text-warm-white text-sm placeholder:text-muted focus:outline-none focus:border-crimson/50 focus:ring-2 focus:ring-crimson/10 transition-all"
                />
                <button
                  type="submit"
                  className="w-11 h-11 flex items-center justify-center bg-crimson rounded-full text-warm-white hover:bg-crimson-light transition-colors"
                  aria-label="Subscribe"
                >
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-glass-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-muted-deep tracking-wider">
            &copy; 2026 NECKLINE Solid Perfume. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="font-mono text-xs text-muted-deep hover:text-muted transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="font-mono text-xs text-muted-deep hover:text-muted transition-colors">
              Terms of Ritual
            </Link>
            <Link href="/traceability" className="font-mono text-xs text-muted-deep hover:text-muted transition-colors">
              Traceability
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
