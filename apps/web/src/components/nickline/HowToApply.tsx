/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as LucideIcons from "lucide-react";

interface HowToApplyProps {
  config?: {
    color?: string;
    steps?: Array<{
      num: string;
      title: string;
      desc: string;
      iconType: "preset" | "custom";
      presetName?: string;
      customIconUrl?: string;
    }>;
  };
}

const DEFAULT_STEPS = [
  {
    num: "01",
    title: "SWIPE",
    desc: "Use your fingertip to gently swipe a small amount of solid perfume.",
    iconType: "preset" as const,
    presetName: "Fingerprint"
  },
  {
    num: "02",
    title: "DAB",
    desc: "Apply to pulse points — neck, wrists, behind ears, or chest.",
    iconType: "preset" as const,
    presetName: "CircleDot"
  },
  {
    num: "03",
    title: "MELT",
    desc: "Let the warmth of your skin melt the perfume naturally.",
    iconType: "preset" as const,
    presetName: "Flame"
  },
  {
    num: "04",
    title: "FEEL",
    desc: "The scent unfolds throughout the day, intimate and lasting.",
    iconType: "preset" as const,
    presetName: "Feather"
  },
  {
    num: "05",
    title: "REPEAT",
    desc: "Reapply anytime to refresh your signature scent.",
    iconType: "preset" as const,
    presetName: "Infinity"
  }
];

export default function HowToApply({ config }: HowToApplyProps) {
  const color = config?.color || "#D21B27";
  const stepsData = config?.steps && config.steps.length > 0 ? config.steps : DEFAULT_STEPS;

  return (
    <section className="py-24 bg-[#070606] select-none text-center" id="how-to-apply">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER */}
        <div className="mb-14">
          <span 
            className="text-[15px] leading-[24px] tracking-[0.2em] font-mono uppercase mb-6 block"
            style={{ color }}
          >
            HOW TO APPLY
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black font-sans uppercase tracking-[0.02em] leading-[0.95]">
            <span className="text-white block mb-1">APPLY WITH INTENTION.</span>
            <span className="block italic" style={{ color }}>FEEL THE PRESENCE.</span>
          </h2>
          <p className="mt-8 text-neutral-400 text-[14px] font-normal leading-relaxed max-w-2xl mx-auto">
            NECKLINE Solid Perfume is designed to melt with your body heat
            and reveal its scent throughout the day. A little goes a long way.
            Follow these simple steps for the best experience.
          </p>
        </div>

        {/* STEPS GRID BOX */}
        <div className="bg-[#111111] border border-white/[0.04] rounded-3xl p-8 md:p-12 mb-10 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-y-12 md:gap-y-0 md:divide-x divide-white/[0.05]">
            {stepsData.map((step) => {
              // Dynamically resolve the preset Lucide icon
              const PresetIcon = step.presetName 
                ? ((LucideIcons as any)[step.presetName] || LucideIcons.Fingerprint)
                : LucideIcons.Fingerprint;

              return (
                <div key={step.num} className="flex flex-col items-center text-center md:px-6 first:pl-0 last:pr-0">
                  <div className="flex justify-center items-center min-h-[80px] mb-6">
                    {step.iconType === "custom" && step.customIconUrl ? (
                      <div className="relative group flex items-center justify-center">
                        <img 
                          src={step.customIconUrl} 
                          alt={step.title} 
                          className="w-20 h-20 object-contain max-h-[80px] max-w-[80px]"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <PresetIcon className="w-18 h-18 text-[#D21B27]" strokeWidth={1} style={{ color }} />
                    )}
                  </div>
                  <h3 className="text-white text-[18px] leading-[30.5px] font-bold uppercase tracking-wider mb-3 flex items-center justify-center gap-2">
                    <span style={{ color, fontFamily: "system-ui" }}>{step.num}</span>
                    <span>{step.title}</span>
                  </h3>
                  <p className="text-neutral-400 text-[13px] font-bold leading-relaxed max-w-xs mx-auto">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* PRO TIP BANNER */}
        <div className="inline-flex flex-col lg:flex-row items-center gap-4 lg:gap-6 px-6 py-4 border border-white/[0.04] bg-[#111111] rounded-xl text-left">
          <div className="flex items-center gap-3 shrink-0">
            {/* Custom abstract star/spark icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M12 2v20 M17 7l-10 10 M22 12H2 M17 17L7 7" />
            </svg>
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase whitespace-nowrap" style={{ color }}>
              PRO TIP
            </span>
          </div>
          <div className="hidden lg:block w-[1px] h-6 bg-white/10" />
          <p className="text-neutral-400 text-[13px] font-light text-center lg:text-left">
            For a longer-lasting scent, apply after moisturizing or layering with unscented lotion.
          </p>
        </div>

      </div>
    </section>
  );
}
