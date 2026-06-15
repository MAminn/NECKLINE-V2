/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Scent } from '../../types/nickline';
import ProductCard from './ProductCard';
import { easeOutExpo } from '../../lib/motion';

interface CollectionProps {
  onOpenQuiz?: () => void;
  scents?: Scent[];
}

export default function Collection({ onOpenQuiz, scents = [] }: CollectionProps) {
  const router = useRouter();
  const displayProducts = scents.filter((p) => p.id !== 'giftset').slice(0, 4);

  return (
    <section id="collection" className="py-24 md:py-32 bg-noir-deep">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        {/* Section header */}
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, ease: easeOutExpo }}
            className="text-overline text-crimson block mb-3"
          >
            OUR SIGNATURE
          </motion.span>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: easeOutExpo }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl tracking-[-0.03em] text-warm-white uppercase">
              INTIMACY
            </h2>
            <span className="text-crimson text-lg">&#10022;</span>
            <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl tracking-[-0.03em] text-warm-white uppercase">
              COLLECTION
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3, ease: easeOutExpo }}
            className="text-base text-muted max-w-md mx-auto"
          >
            Four unique scents. Four different moods. One unforgettable experience.
          </motion.p>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.5, ease: easeOutExpo }}
            className="flex flex-wrap items-center justify-center gap-4 mt-8"
          >
            <button onClick={() => router.push('/shop')} className="btn-primary">
              EXPLORE ALL SCENTS
            </button>
            {onOpenQuiz && (
              <button onClick={onOpenQuiz} className="btn-ghost">
                FIND YOUR SCENT
              </button>
            )}
          </motion.div>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
