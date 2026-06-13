/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface QuoteBannerProps {
  heroImage: string;
}

export default function QuoteBanner({ heroImage }: QuoteBannerProps) {
  return (
    <section className="py-12 select-none" id="story">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          className="relative overflow-hidden rounded-2xl border flex flex-col lg:flex-row items-center justify-between text-left bg-bg-secondary/85 border-primary/10"
          id="quote-banner-container"
        >
          {/* Decorative glowing gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />

          {/* Left Side: Sensory Quote text block */}
          <div className="w-full lg:w-3/5 p-8 md:p-12 z-10">
            <span className="text-4xl md:text-5xl font-serif text-primary leading-none select-none italic font-bold">
              “
            </span>
            <blockquote className="text-lg md:text-xl font-light leading-relaxed text-text-secondary tracking-wide font-serif italic mb-6">
              Neckline is far more than a simple fragrance: intimate, skin-close, sensory. Incredibly subtle, deeply sensual, it merges beautifully with my natural chemistry all day. Absolutely addictive.
            </blockquote>
            <cite className="text-xs font-semibold tracking-[0.3em] text-primary not-italic uppercase block">
              — JESSICA M.
            </cite>
          </div>

          {/* Right Side: Sleek visual showcase crop */}
          <div className="w-full lg:w-2/5 aspect-[16/9] lg:aspect-auto lg:self-stretch min-h-[220px] relative overflow-hidden">
            <img
              src={heroImage}
              alt="Intimacy solid perfume setup on crushed velvet fabric background"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]"
              referrerPolicy="no-referrer"
              id="quote-illustration-img"
            />
            {/* Soft dark burgundy edge overlay */}
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-bg-secondary to-transparent pointer-events-none hidden lg:block" />
          </div>

        </div>
      </div>
    </section>
  );
}
