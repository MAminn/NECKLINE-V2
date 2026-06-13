import { Scent } from "../../types/nickline";
import { useState } from "react";
import { ArrowLeft, Shield, Check, Heart, Plus, Minus, Info, HeartPulse, ShieldCheck, Pocket } from "lucide-react";
import { motion } from "framer-motion";

interface ProductPageProps {
  scent: Scent;
  onAddToCart: (scent: Scent, quantity: number) => void;
  onBack: () => void;
  suggestedScents: Scent[];
  onOpenProduct: (scent: Scent) => void;
}

export default function ProductPage({ scent, onAddToCart, onBack, suggestedScents, onOpenProduct }: ProductPageProps) {
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const displayImages = scent.galleryImages && scent.galleryImages.filter(img => img).length > 0 
    ? scent.galleryImages.filter(img => img) // Filter out empty strings
    : [scent.image, scent.image, scent.image]; // Fallback to 3 identical images

  const activeImage = displayImages[activeIndex] || scent.image;

  const toggleAccordion = (name: string) => {
    setOpenAccordion(openAccordion === name ? null : name);
  };

  return (
    <div className="bg-bg min-h-screen text-text-primary pt-28 pb-16 selection:bg-primary selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center text-xs font-mono tracking-wider text-text-muted mb-8 border-b border-white/[0.05] pb-4">
          <button onClick={onBack} className="hover:text-white transition-colors uppercase cursor-pointer">HOME</button>
          <span className="mx-2">/</span>
          <button onClick={onBack} className="hover:text-white transition-colors uppercase cursor-pointer">SHOP</button>
          <span className="mx-2">/</span>
          <span className="text-primary uppercase">{scent.name}</span>
        </nav>

        {/* Main Product Layout */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 mb-24">
          
          {/* Left: Images Desktop (Gallery + Main) */}
          <div className="lg:w-[55%] flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex flex-row md:flex-col gap-3 overflow-x-auto md:min-w-[80px] pb-2 md:pb-0 scrollbar-hide">
              {displayImages.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`w-20 h-20 shrink-0 border rounded-sm overflow-hidden bg-black/20 p-2 cursor-pointer ${activeIndex === idx ? 'border-primary' : 'border-white/10'}`}
                  onClick={() => setActiveIndex(idx)}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className={`w-full h-full object-cover rounded-sm transition-opacity ${activeIndex === idx ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`} />
                </div>
              ))}
            </div>

            {/* Main Featured Image */}
            <div className="relative w-full aspect-square border border-white/5 rounded-2xl overflow-hidden bg-surface-alt/40 group flex-1">
              <img 
                src={activeImage} 
                alt={`${scent.name} solid perfume product`} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1200ms] ease-out pointer-events-none" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/60 via-transparent to-bg/10 pointer-events-none" />
            </div>
          </div>

          {/* Right: Product Details & Controls */}
          <div className="lg:w-[45%] flex flex-col justify-start">
            <h1 className="text-4xl lg:text-5xl t-headline text-white mb-2">
              {scent.name}
            </h1>
            <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase mb-8">
              {scent.subtitle}
            </p>
            
            <div className="text-2xl font-bold font-sans tracking-wider text-white mb-6">
              ${scent.price.toFixed(2)}
            </div>

            <p className="text-sm font-light text-text-secondary leading-relaxed mb-8 max-w-lg">
              {scent.description || scent.longDescription} A delicate blend of blooming florals and smooth musk creates a scent that lingers close, leaving a lasting impression.
            </p>

            {/* Benefits Row Grid */}
            <div className="grid grid-cols-4 gap-2 border-y border-white/[0.05] py-6 mb-8 text-center text-text-tertiary">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5 text-primary">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <span className="text-xs uppercase tracking-wider font-semibold">Pulse<br/>Activated</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5 text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-xs uppercase tracking-wider font-semibold">Skin<br/>Safe</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5 text-primary">
                  <Pocket className="w-5 h-5" />
                </div>
                <span className="text-xs uppercase tracking-wider font-semibold">Discreet &<br/>Portable</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5 text-primary">
                  <Heart className="w-5 h-5" />
                </div>
                <span className="text-xs uppercase tracking-wider font-semibold">Made For<br/>Intimacy</span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6 flex items-center gap-4">
              <span className="text-xs tracking-widest font-mono text-text-tertiary">QUANTITY</span>
              <div className="flex items-center space-x-4 border border-white/10 rounded-md px-4 py-2 bg-black/20">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="text-text-tertiary hover:text-white cursor-pointer"><Minus className="w-3.5 h-3.5" /></button>
                <span className="text-sm font-mono w-4 text-center">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="text-text-tertiary hover:text-white cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mb-8">
              <button 
                onClick={() => onAddToCart(scent, quantity)}
                className="w-full py-4 bg-primary hover:bg-primary-hover text-white text-xs tracking-[0.2em] font-extrabold uppercase transition-all duration-300 shadow-[0_0_20px_rgba(210,27,39,0.2)] rounded-sm cursor-pointer"
              >
                ADD TO CART
              </button>
              <button 
                onClick={() => {
                  onAddToCart(scent, quantity);
                  // Optionally open cart directly
                }}
                className="w-full py-4 bg-transparent border border-white hover:bg-white hover:text-black text-white text-xs tracking-[0.2em] font-extrabold uppercase transition-all duration-300 rounded-sm cursor-pointer"
              >
                BUY IT NOW
              </button>
            </div>

            {/* Trust Badges */}
            <div className="space-y-2 text-xs text-text-tertiary font-light mb-8">
              <div className="flex items-center gap-2"><span className="text-white">🚚</span> Free shipping on orders $50+</div>
              <div className="flex items-center gap-2"><span className="text-white">🕒</span> 30-day returns</div>
              <div className="flex items-center gap-2"><span className="text-white">📦</span> Discreet packaging</div>
            </div>

            {/* Accordions */}
            <div className="border-t border-white/[0.05] divide-y divide-white/[0.05]">
              <div className="py-4">
                <button onClick={() => toggleAccordion('how')} className="w-full flex items-center justify-between text-xs tracking-widest font-semibold uppercase text-text-secondary hover:text-white transition-colors cursor-pointer outline-none cursor-pointer">
                  HOW TO USE
                  {openAccordion === 'how' ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
                {openAccordion === 'how' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 text-xs font-light text-text-muted leading-relaxed overflow-hidden">
                    Take a small amount of solid perfume on your fingertip. Warm it gently and apply it directly to pulse points: the neck, wrists, or behind the ears. The scent is activated by your body heat for a close-range, intimate aura.
                  </motion.div>
                )}
              </div>
              <div className="py-4">
                <button onClick={() => toggleAccordion('ingredients')} className="w-full flex items-center justify-between text-xs tracking-widest font-semibold uppercase text-text-secondary hover:text-white transition-colors cursor-pointer outline-none cursor-pointer">
                  INGREDIENTS
                  {openAccordion === 'ingredients' ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
                {openAccordion === 'ingredients' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 text-xs font-light text-text-muted leading-relaxed overflow-hidden">
                    {scent.ingredients?.join(', ') || 'Natural Beeswax, Jojoba Oil, Premium Fragrance Oils, Essential Oils. Free from alcohol and parabens.'}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quote Block Below Images (Replicating Design) */}
        <div className="mb-20 max-w-xl text-left border-l border-border pl-6 py-2">
          <div className="text-primary text-3xl font-serif leading-none h-6 content-start mb-2">&ldquo;</div>
          <p className="text-lg font-serif italic text-white leading-relaxed mb-4">
            {scent.name} wraps around you like silk: soft, sensual, and unforgettable. My go-to for date nights.
          </p>
          <span className="text-xs tracking-widest font-bold text-primary uppercase">
            — SOPHIA R.
          </span>
        </div>

        {/* You Might Also Love Section */}
        {suggestedScents && suggestedScents.length > 0 && (
          <div className="mb-24">
            <div className="flex flex-col items-center justify-center mb-8 gap-2">
              <span className="text-primary text-lg leading-none">✦</span>
              <h3 className="text-sm t-headline tracking-[0.2em] text-text-secondary">
                YOU MIGHT ALSO LOVE
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {suggestedScents.slice(0, 3).map((related) => (
                <div key={related.id} 
                     onClick={() => onOpenProduct(related)}
                     className="group border border-white/[0.05] bg-surface-alt/60 hover:bg-surface hover:border-primary/30 transition-all duration-300 rounded-lg p-3 cursor-pointer overflow-hidden flex flex-col h-full">
                  <div className="relative w-full h-[180px] mb-4 bg-black rounded overflow-hidden">
                    {/* Simulated small banner image for related products */}
                    <img src={related.image} className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" alt={related.name} />
                  </div>
                  <h4 className="text-sm t-headline tracking-widest text-white mb-1">
                    {related.name}
                  </h4>
                  <p className="text-xs text-text-tertiary mb-3 block truncate">
                    {related.subtitle}
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-sm font-semibold text-white tracking-widest">${related.price.toFixed(2)}</span>
                    <div className="text-xs text-primary flex items-center gap-0.5">
                      ★★★★★ <span className="text-text-muted ml-1">(124)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Reviews Section Simulator */}
        <div className="border-t border-white/[0.05] pt-16 mt-16 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            
            {/* Reviews Summary Stats */}
            <div className="col-span-1 border-r border-white/5 pr-8">
              <h3 className="text-xs t-headline tracking-[0.18em] text-text-secondary mb-4">CUSTOMER REVIEWS</h3>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-4xl font-serif font-light text-white leading-none">4.9</span>
                <div className="flex text-primary space-x-1 pb-1 text-sm">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
              </div>
              <p className="text-xs text-text-muted font-light">Based on 547 reviews</p>
            </div>

            {/* Individual Reviews Grid */}
            <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-1 text-primary text-xs mb-1">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                  <span className="text-xs text-text-muted tracking-wider uppercase ml-2 flex items-center gap-1"><Shield className="w-3 h-3 text-success"/> Verified Buyer</span>
                </div>
                <p className="text-sm text-text-secondary font-light leading-relaxed mb-3">
                  Smells incredible and lasts all day. So subtle but powerful.
                </p>
                <span className="text-xs text-text-muted uppercase tracking-widest">— Jasmine T.</span>
              </div>

              <div>
                <div className="flex items-center gap-1 text-primary text-xs mb-1">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                  <span className="text-xs text-text-muted tracking-wider uppercase ml-2 flex items-center gap-1"><Shield className="w-3 h-3 text-success"/> Verified Buyer</span>
                </div>
                <p className="text-sm text-text-secondary font-light leading-relaxed mb-3">
                  Perfect for travel and super easy to apply. My new favorite scent.
                </p>
                <span className="text-xs text-text-muted uppercase tracking-widest">— Daniel K.</span>
              </div>
            </div>
            
          </div>
          
          <div className="mt-12 text-center">
            <button className="px-6 py-3 border border-white/20 hover:border-white/60 hover:bg-white/5 transition-all text-xs uppercase tracking-[0.2em] text-white">
              VIEW ALL REVIEWS
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
