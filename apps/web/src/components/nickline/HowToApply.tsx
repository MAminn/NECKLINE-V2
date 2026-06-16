/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Fingerprint,
  Crosshair,
  Flame,
  Wind,
  RefreshCw,
  Sparkles,
  Heart,
  Star,
  Target,
  Droplets,
  Moon,
  Sun,
  LucideIcon,
} from 'lucide-react';
import { easeOutExpo, easeOutBack } from '../../lib/motion';
import type { HowToApply as HowToApplyConfig } from '../../types/nickline';

const ICON_MAP: Record<string, LucideIcon> = {
  Fingerprint,
  Crosshair,
  Flame,
  Wind,
  RefreshCw,
  Sparkles,
  Heart,
  Star,
  Target,
  Droplets,
  Moon,
  Sun,
};

type Step = { number: string; title: string; description: string; icon: LucideIcon };

const DEFAULT_STEPS: Step[] = [
  { number: '01', title: 'SWIPE', description: 'Use your fingertip to gently swipe a small amount of solid perfume.', icon: Fingerprint },
  { number: '02', title: 'DAB', description: 'Apply to pulse points — neck, wrists, behind ears, or chest.', icon: Crosshair },
  { number: '03', title: 'MELT', description: 'Let the warmth of your skin melt the perfume naturally.', icon: Flame },
  { number: '04', title: 'FEEL', description: 'The scent unfolds throughout the day, intimate and lasting.', icon: Wind },
  { number: '05', title: 'REPEAT', description: 'Reapply anytime to refresh your signature scent.', icon: RefreshCw },
];

interface HowToApplyProps {
  config?: HowToApplyConfig;
}

export default function HowToApply({ config }: HowToApplyProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const accentColor = config?.color || '#D21B27';
  const steps: Step[] = config?.steps?.length
    ? config.steps.map((s) => ({
        number: s.num,
        title: s.title,
        description: s.desc,
        icon: ICON_MAP[s.presetName || 'Fingerprint'] || Fingerprint,
      }))
    : DEFAULT_STEPS;

  return (
    <section id="ritual" ref={sectionRef} className="py-24 md:py-32 bg-noir relative">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: easeOutExpo }}
            className="font-display font-bold text-4xl md:text-5xl lg:text-6xl tracking-[-0.03em] text-warm-white uppercase mb-2"
          >
            APPLY WITH INTENTION.
          </motion.h2>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease: easeOutExpo }}
            className="font-display font-bold text-4xl md:text-5xl lg:text-6xl tracking-[-0.03em] uppercase mb-6"
            style={{ color: accentColor }}
          >
            FEEL THE PRESENCE.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3, ease: easeOutExpo }}
            className="text-base text-muted max-w-lg mx-auto"
          >
            NECKLINE Solid Perfume is designed to melt with your body heat and reveal its scent throughout the day. A little goes a long way.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Desktop: horizontal layout with connecting line */}
          <div className="hidden md:block relative">
            {/* SVG connecting line */}
            <svg
              className="absolute top-6 left-0 w-full h-2 pointer-events-none"
              preserveAspectRatio="none"
              style={{ overflow: 'visible' }}
            >
              <line
                x1="10%"
                y1="50%"
                x2="90%"
                y2="50%"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
              <motion.line
                x1="10%"
                y1="50%"
                x2="90%"
                y2="50%"
                stroke={accentColor}
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.3 }}
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: 0,
                }}
              />
            </svg>

            <div
              className="grid gap-4 relative z-10"
              style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
            >
              {steps.map((step, i) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{
                    duration: 0.4,
                    delay: 0.3 + i * 0.2,
                    ease: easeOutBack,
                  }}
                  className="flex flex-col items-center text-center"
                >
                  {/* Circle with icon */}
                  <div className="w-12 h-12 rounded-full border border-glass-border bg-noir flex items-center justify-center mb-4">
                    <step.icon size={18} style={{ color: accentColor }} />
                  </div>
                  {/* Number and title */}
                  <span className="font-mono text-xs mb-1" style={{ color: accentColor }}>{step.number}</span>
                  <h4 className="font-display font-medium text-xs tracking-[0.08em] text-warm-white uppercase mb-2">
                    {step.title}
                  </h4>
                  <p className="text-xs text-muted leading-relaxed max-w-[160px]">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile: vertical layout */}
          <div className="md:hidden space-y-8 relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-glass-border">
              <motion.div
                className="w-full"
                style={{ background: accentColor }}
                initial={{ height: '0%' }}
                animate={isInView ? { height: '100%' } : {}}
                transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.3 }}
              />
            </div>

            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{
                  duration: 0.4,
                  delay: 0.3 + i * 0.15,
                  ease: easeOutExpo,
                }}
                className="flex items-start gap-4 relative z-10"
              >
                <div className="w-12 h-12 rounded-full border border-glass-border bg-noir flex items-center justify-center flex-shrink-0">
                  <step.icon size={18} style={{ color: accentColor }} />
                </div>
                <div>
                  <span className="font-mono text-xs" style={{ color: accentColor }}>{step.number}</span>
                  <h4 className="font-display font-medium text-xs tracking-[0.08em] text-warm-white uppercase mb-1">
                    {step.title}
                  </h4>
                  <p className="text-xs text-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pro Tip card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 1.5, ease: easeOutExpo }}
          className="mt-12 max-w-2xl mx-auto"
        >
          <div className="glass-card rounded-lg p-5 flex items-center gap-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Sparkles size={16} style={{ color: accentColor }} />
              <span className="text-overline" style={{ color: accentColor }}>PRO TIP</span>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              For a longer-lasting scent, apply after moisturizing or layering with unscented lotion.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
