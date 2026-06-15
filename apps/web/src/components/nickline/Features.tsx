/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { motion } from 'framer-motion';
import { HeartPulse, ShieldCheck, Package, Sparkles } from 'lucide-react';
import { easeOutExpo } from '../../lib/motion';

const features = [
  {
    icon: HeartPulse,
    title: 'PULSE ACTIVATED',
    description: 'Melts with your body heat for a lasting, intimate scent.',
  },
  {
    icon: ShieldCheck,
    title: 'SKIN SAFE',
    description: 'Made with clean, skin-loving ingredients.',
  },
  {
    icon: Package,
    title: 'DISCREET & PORTABLE',
    description: 'Compact tin. No spills. Take it anywhere.',
  },
  {
    icon: Sparkles,
    title: 'MADE FOR INTIMACY',
    description: 'Subtle. Seductive. Unforgettable.',
  },
];

export default function Features() {
  return (
    <section className="bg-noir-lift py-10 md:py-12">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.4,
                delay: i * 0.1,
                ease: easeOutExpo,
              }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-crimson/10 flex items-center justify-center mb-4">
                <feature.icon size={24} className="text-crimson" />
              </div>
              <h3 className="font-display font-medium text-xs tracking-[0.08em] text-warm-white uppercase mb-2">
                {feature.title}
              </h3>
              <p className="text-xs text-muted leading-relaxed max-w-[200px]">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
