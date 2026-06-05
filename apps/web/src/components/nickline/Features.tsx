/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { HeartPulse, ShieldCheck, Pocket, Heart } from "lucide-react";
import { useReveal } from "../../hooks/useReveal";

export default function Features() {
  const ref = useReveal<HTMLElement>();

  const list = [
    {
      icon: <HeartPulse className="w-5 h-5 text-[#D21B27]" />,
      title: "PULSE ACTIVATED",
      description: "Melts with your body heat for a lasting, intimate scent.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#D21B27]" />,
      title: "SKIN SAFE",
      description: "Made with clean, skin-loving ingredients.",
    },
    {
      icon: <Pocket className="w-5 h-5 text-[#D21B27]" />,
      title: "DISCREET & PORTABLE",
      description: "Compact tin. No spills. Take it anywhere.",
    },
    {
      icon: <Heart className="w-5 h-5 text-[#D21B27]" />,
      title: "MADE FOR INTIMACY",
      description: "Subtle. Seductive. Unforgettable.",
    },
  ];

  return (
    <section
      ref={ref}
      className="py-12 bg-[#070606] reveal"
      id="features-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="border border-white/[0.06] bg-[#0a0a0a] rounded-2xl py-8 px-2 grid grid-cols-1 md:grid-cols-4 gap-y-6 md:gap-y-0 md:divide-x divide-white/[0.06]"
          id="features-banner-container"
        >
          {list.map((feat, index) => (
            <div
              key={index}
              className="flex items-center gap-4 px-6 select-none"
              id={`feature-column-${index}`}
            >
              <div className="w-11 h-11 rounded-full border border-white/[0.08] flex items-center justify-center shrink-0 animate-pulse-glow">
                {feat.icon}
              </div>
              <div className="flex flex-col gap-0.5">
                <h4 className="text-xs tracking-[0.15em] font-bold text-white uppercase">
                  {feat.title}
                </h4>
                <p className="text-sm text-[#C0C0C0] leading-relaxed">
                  {feat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
