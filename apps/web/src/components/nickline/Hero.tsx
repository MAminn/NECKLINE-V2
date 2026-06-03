import { ArrowRight, Compass, Flame, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from "react";
import { HeaderSlide } from "../../types/nickline";

interface HeroProps {
  onScrollToSection: (sectionId: string) => void;
  onOpenQuiz: () => void;
  heroImage: string;
  slides?: HeaderSlide[];
}

export default function Hero({ onScrollToSection, onOpenQuiz, heroImage, slides = [] }: HeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Fallback default slide list if live DB slides are loading or empty
  const activeSlides = slides && slides.length > 0 ? slides : [
    {
      id: "default-1",
      image: heroImage,
      title: "Wear Your Neckline",
      subtitle: "Solid Fragrance – Designed For Intimacy",
      description: "A concentrated solid perfume that melts with your body heat on your pulse points, leaving a trail that's close, personal, seductive, and unforgettable. Intimacy starts here.",
      buttonText: "Shop Now",
      linkTo: "collection"
    }
  ];

  // Auto-play interval: rotate slide every 5 seconds
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    
    // Safety check to reset active index if its index bounds became invalid
    if (activeIndex >= activeSlides.length) {
      setActiveIndex(0);
    }

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % activeSlides.length);
    }, 5500); // 5.5s slightly padded to stay perfectly legible and transition cleanly at 5s minimum

    return () => clearInterval(timer);
  }, [activeSlides, activeIndex]);

  const currentSlide = activeSlides[activeIndex] || activeSlides[0] || {
    id: "default-fallback",
    image: heroImage,
    title: "Wear Your Neckline",
    subtitle: "Solid Fragrance – Designed For Intimacy",
    description: "A concentrated solid perfume that melts with your body heat on your pulse points, leaving a trail that's close, personal, seductive, and unforgettable.",
    buttonText: "Shop Now",
    linkTo: "collection"
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % activeSlides.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex(index);
  };

  return (
    <section 
      id="hero" 
      className="relative min-h-[calc(100vh-80px)] xl:min-h-[85vh] flex items-center justify-start overflow-hidden select-none
        dark:bg-[#070606] light:bg-[#FAF8F5] transition-colors duration-500"
    >
      {/* FULL-SIZE BOUNDARY IMAGE BACKGROUND CAROUSEL */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden" id="hero-background-wrapper">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={`${currentSlide.id}-${activeIndex}`}
            src={currentSlide.image}
            alt={currentSlide.title}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover object-right md:object-center"
            referrerPolicy="no-referrer"
            id={`hero-bg-${currentSlide.id}`}
          />
        </AnimatePresence>
        
        {/* Intimate atmospheric gradients to ensure absolute contrast for text overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070606]/95 via-[#070606]/85 sm:via-[#070606]/70 md:via-[#070606]/55 to-transparent z-10 dark:block hidden" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5]/98 via-[#FAF8F5]/92 sm:via-[#FAF8F5]/80 md:via-[#FAF8F5]/50 to-transparent z-10 dark:hidden block" />
        
        {/* Bottom fade to hide the edge of the slide into the next sections */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#070606] to-transparent z-10 dark:block hidden pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#FAF8F5] to-transparent z-10 dark:hidden block pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative z-20 py-16">
        <div className="max-w-xl md:max-w-2xl flex flex-col space-y-6 text-left" id="hero-left-content">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={`meta-${currentSlide.id}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-2"
            >
              <span className="h-[1px] w-6 bg-[#D21B27]" />
              <h3 className="text-[10px] sm:text-xs font-semibold tracking-[0.3em] text-[#D21B27] uppercase">
                {currentSlide.subtitle || "Solid Fragrance – Designed For Intimacy"}
              </h3>
            </motion.div>
          </AnimatePresence>

          {/* MAIN TITLES WITH ANIMATED CROSSFADE */}
          <AnimatePresence mode="wait">
            <motion.h1 
              key={`title-${currentSlide.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-4xl sm:text-6xl lg:text-7.5xl font-display font-medium leading-[1.0] tracking-tight text-neutral-900 dark:text-white uppercase"
              id="hero-title-headline"
            >
              {currentSlide.title}
            </motion.h1>
          </AnimatePresence>

          {/* SUB DESCR */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`desc-${currentSlide.id}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-sm sm:text-base leading-relaxed max-w-lg font-light
                dark:text-neutral-200 light:text-stone-850"
              id="hero-description"
            >
              {currentSlide.description}
            </motion.p>
          </AnimatePresence>

          {/* INTIMATE CTA ACTIONS */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`cta-${currentSlide.id}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="flex flex-wrap items-center gap-4 pt-4"
              id="hero-action-buttons"
            >
              <button
                onClick={() => onScrollToSection(currentSlide.linkTo || "collection")}
                className="px-8 py-4 bg-[#D21B27] hover:bg-[#B0151E] text-white text-xs tracking-[0.25em] font-semibold uppercase transition-all duration-300 shadow-xl cursor-pointer hover:shadow-red-950/20 hover:-translate-y-0.5 rounded-none flex items-center gap-2"
                id="hero-btn-shop"
              >
                {currentSlide.buttonText || "Shop Now"}
              </button>
              <button
                onClick={() => onScrollToSection("story")}
                className="px-8 py-4 bg-transparent border border-neutral-300 dark:border-neutral-800 dark:text-stone-300 dark:hover:text-white light:text-stone-800 light:hover:text-black light:hover:border-black text-xs tracking-[0.25em] font-semibold uppercase transition-all duration-300 inline-flex items-center gap-2 cursor-pointer rounded-none group"
                id="hero-btn-story"
              >
                Our Story <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          </AnimatePresence>

          {/* EXTRA NO-MOCK PERSISTENCE FEATURES */}
          <div className="flex items-center gap-6 pt-4 text-xs dark:text-neutral-400 light:text-stone-700 font-mono tracking-wider border-t border-neutral-100/10 dark:border-neutral-900/40 w-full max-w-sm">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#D21B27]" />
              <span>Sensory Skin Release</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Pheromone Active</span>
            </div>
          </div>

        </div>
      </div>

      {/* CAROUSEL DIRECT MANUAL NAVIGATION ARROWS */}
      {activeSlides.length > 1 && (
        <div className="absolute right-8 bottom-8 z-30 flex items-center gap-3">
          {/* Previous slide index trigger */}
          <button
            onClick={handlePrev}
            className="w-10 h-10 rounded-full border border-white/10 dark:hover:border-[#D21B27]/40 hover:border-[#070606]/30 bg-[#070606]/40 hover:bg-[#D21B27]/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 px-1">
            {activeSlides.map((_, i) => (
              <button
                key={i}
                onClick={(e) => handleDotClick(i, e)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  i === activeIndex 
                    ? "w-6 h-1.5 bg-[#D21B27]" 
                    : "w-1.5 h-1.5 bg-neutral-600 hover:bg-neutral-400"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Next slide index trigger */}
          <button
            onClick={handleNext}
            className="w-10 h-10 rounded-full border border-white/10 dark:hover:border-[#D21B27]/40 hover:border-[#070606]/30 bg-[#070606]/40 hover:bg-[#D21B27]/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ROTATING BADGE STAMP — Desktop only */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-44 z-20 cursor-pointer hidden lg:block" id="hero-stamp-badge" onClick={onOpenQuiz}>
        <div className="relative w-32 h-32 md:w-36 md:h-36">
          <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 100 100">
            <defs>
              <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" />
            </defs>
            <text className="font-mono text-[7px] uppercase tracking-widest dark:fill-stone-300 light:fill-stone-800 select-none">
              <textPath href="#circlePath" startOffset="0%">
                • Scent finder quiz • find your vibe • wear intimacy •
              </textPath>
            </text>
          </svg>
          <div className="absolute inset-4 rounded-full bg-neutral-950 dark:bg-[#070606] flex items-center justify-center border border-[#D21B27]/40 shadow-xl hover:scale-105 transition-transform duration-300 group">
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-[#D21B27] text-lg font-serif inline-flex items-center justify-center w-[21.6875px] h-[25px]">✦</span>
              <span className="text-[12px] tracking-widest text-[#C29F68] font-bold uppercase mt-1">Quiz</span>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE QUIZ CTA — Visible on smaller screens */}
      <div className="lg:hidden absolute bottom-8 right-4 z-20">
        <button
          onClick={onOpenQuiz}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D21B27]/90 hover:bg-[#D21B27] text-white text-[11px] tracking-[0.2em] font-bold uppercase rounded-full backdrop-blur-md border border-[#D21B27]/50 shadow-lg transition-all duration-300 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Scent Finder
        </button>
      </div>
    </section>
  );
}
