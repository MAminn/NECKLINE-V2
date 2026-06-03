/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Scent } from "../../types/nickline";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface CollectionProps {
  onAddToCart: (scent: Scent) => void;
  onOpenQuiz: () => void;
  scents?: Scent[];
  onOpenShop?: () => void;
  onOpenProduct: (scent: Scent) => void;
}

export default function Collection({ onAddToCart, onOpenQuiz, scents, onOpenShop, onOpenProduct }: CollectionProps) {
  const displayScents = scents || [];

  return (
    <section 
      id="collection" 
      className="py-6 select-none transition-colors duration-500 overflow-hidden bg-[#070606]"
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ width: '1290px', maxWidth: '100%' }}>
        
        {/* Unified Luxury Container Box matching the reference design */}
        <div 
          className="bg-[#090909] border border-white/[0.04] p-3 sm:p-4 lg:p-5 rounded-2xl" 
          id="intimacy-bento-container"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[0.95fr_1.25fr_1.25fr_1.25fr_1.25fr] gap-3 xl:gap-3.5 items-stretch text-left">
            
            {/* Left Column Brand Intro Panel */}
            <div className="col-span-1 md:col-span-2 lg:col-span-1 flex flex-col justify-between p-4 border border-white/[0.02] bg-white/[0.01]/30 rounded-2xl text-left" id="intimacy-brand-intro">
              <div className="space-y-4">
                <span className="text-[10px] tracking-[0.3em] font-extrabold text-[#D21B27] uppercase block font-mono">
                  OUR SIGNATURE
                </span>
                
                <h3 className="text-2xl sm:text-3xl lg:text-[20px] xl:text-[26px] font-black tracking-tight text-white uppercase leading-[0.95] font-sans">
                  INTIMACY <br className="hidden lg:block" /> COLLECTION
                </h3>
                
                {/* Visual signature star/line ornament */}
                <div className="flex items-center gap-2 my-2">
                  <div className="w-8 h-[1.5px] bg-[#D21B27]" />
                  <span className="text-[#D21B27] text-xs leading-none">✦</span>
                </div>

                <p className="text-neutral-400 text-[11px] font-light leading-relaxed max-w-[240px] opacity-90">
                  Four unique scents. Four different moods. One unforgettable experience.
                </p>
              </div>
              
              <div className="pt-6 lg:pt-0">
                <div className="space-y-2">
                  <button
                    onClick={onOpenShop}
                    className="py-2.5 px-4 bg-[#D21B27] hover:bg-[#E32B37] text-white text-[10px] tracking-[0.2em] font-bold uppercase transition-colors duration-300 rounded-[3px] hover:shadow-[0_0_24px_rgba(210,27,39,0.35)] cursor-pointer active:scale-95 w-full flex items-center justify-center font-sans animate-glow-pulse gpu-layer"
                    id="btn-explore-scents"
                  >
                    EXPLORE ALL SCENTS
                  </button>
                  {onOpenQuiz && (
                    <button
                      onClick={onOpenQuiz}
                      className="py-2 px-4 bg-transparent border border-white/10 hover:border-[#D21B27]/50 text-neutral-300 hover:text-white text-[10px] tracking-[0.2em] font-bold uppercase transition-colors duration-300 rounded-[3px] cursor-pointer w-full flex items-center justify-center gap-1.5 font-sans"
                      id="btn-find-scent"
                    >
                      <Sparkles className="w-3 h-3 text-[#D21B27]" />
                      FIND YOUR SCENT
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column Product Cards - exactly 4 sibling columns in the same grid */}
            {displayScents.slice(0, 4).map((scent) => (
              <motion.div 
                key={scent.id}
                onClick={() => onOpenProduct(scent)}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group relative flex flex-col justify-between p-4 overflow-hidden border border-white/[0.05] hover:border-[#D21B27]/35 hover:shadow-[0_22px_50px_rgba(210,27,39,0.14)] transition-colors duration-500 rounded-2xl cursor-pointer min-h-[340px] lg:min-h-[320px] col-span-1 gpu-layer"
                id={`scent-item-${scent.id}`}
              >
                {/* Full image filling card behind overlays with smooth hover zoom */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={scent.image}
                    alt={`${scent.name} Solid Scent Container Slide`}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-90 pointer-events-none gpu-layer"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Dense vignette for high-contrast legible texts */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070606]/85 via-[#070606]/10 to-[#070606]/55 z-0 pointer-events-none" />
                </div>

                {/* Center pill box tag top */}
                <div className="w-full text-center pt-2 z-10 pointer-events-none flex justify-center">
                  <div className="bg-black/40 border border-white/5 py-1.5 px-4 rounded-xl text-center shadow-lg inline-block w-auto max-w-[190px]">
                    <h3 className="text-white text-[12px] font-extrabold tracking-[0.18em] font-sans uppercase">
                      {scent.name}
                    </h3>
                    <p className="text-[8px] text-zinc-300 font-medium tracking-wide mt-0.5 block break-words leading-tight">
                      {scent.subtitle}
                    </p>
                  </div>
                </div>

                {/* Centered price & shop now bottom line */}
                <div className="text-center z-10 w-full mt-auto flex flex-col items-center gap-3">
                  <span className="text-[13px] font-bold tracking-[0.14em] font-sans text-white block">
                    ${scent.price.toFixed(2)}
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Stop opening modal details click
                      if (onOpenShop) {
                        onOpenShop();
                      } else {
                        onAddToCart(scent);
                      }
                    }}
                    className="w-full py-2.5 border border-white/10 hover:border-white/30 bg-black/20 hover:bg-black/55 hover:shadow-[0_4px_16px_rgba(255,255,255,0.02)] text-white text-[9px] tracking-[0.16em] font-bold uppercase transition-colors duration-300 flex items-center justify-center gap-2 rounded-lg cursor-pointer"
                    title={`Browse ${scent.name} in shop`}
                  >
                    <span>SHOP NOW</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
