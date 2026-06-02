import { useState, FormEvent } from "react";
import { 
  Tag, Plus, Trash2, Compass, AlertCircle, Calendar, Gift, Check, X, Ticket
} from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  amount: number;
  minSpend: number;
  status: "ACTIVE" | "EXPIRED";
  usedCount: number;
}

interface Offer {
  id: string;
  title: string;
  subtitle: string;
  type: "BOGO" | "DISCOUNT" | "BUNDLE";
  status: "ACTIVE" | "DRAFT";
  validUntil: string;
}

interface AdminOffersTabProps {
  coupons: Coupon[];
  offers: Offer[];
  onAddCoupon: (payload: any) => Promise<void>;
  onDeleteCoupon: (id: string) => Promise<void>;
  onAddOffer: (payload: any) => Promise<void>;
  onDeleteOffer: (id: string) => Promise<void>;
  onRefresh: () => void;
  globalSearchQuery?: string;
}

export default function AdminOffersTab({ 
  coupons, 
  offers, 
  onAddCoupon, 
  onDeleteCoupon, 
  onAddOffer, 
  onDeleteOffer, 
  onRefresh,
  globalSearchQuery
}: AdminOffersTabProps) {
  const query = (globalSearchQuery || "").toLowerCase().trim();

  const filteredCoupons = coupons.filter(c => 
    !query || 
    c.code.toLowerCase().includes(query) || 
    c.discountType.toLowerCase().includes(query) ||
    c.amount.toString().includes(query)
  );

  const filteredOffers = offers.filter(off => 
    !query ||
    off.title.toLowerCase().includes(query) ||
    off.subtitle.toLowerCase().includes(query) ||
    off.type.toLowerCase().includes(query)
  );

  // Coupon Form
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountAmount, setDiscountAmount] = useState("");
  const [minSpend, setMinSpend] = useState("");

  // Offer Form
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [offerTitle, setOfferTitle] = useState("");
  const [offerSubtitle, setOfferSubtitle] = useState("");
  const [offerType, setOfferType] = useState<"BOGO" | "DISCOUNT" | "BUNDLE">("DISCOUNT");
  const [validUntil, setValidUntil] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleCouponSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!couponCode || !discountAmount) return;

    setIsLoading(true);
    await onAddCoupon({
      code: couponCode,
      discountType,
      amount: parseFloat(discountAmount),
      minSpend: minSpend ? parseFloat(minSpend) : 0
    });

    setCouponCode("");
    setDiscountAmount("");
    setMinSpend("");
    setShowAddCoupon(false);
    setIsLoading(false);
  };

  const handleOfferSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!offerTitle) return;

    setIsLoading(true);
    await onAddOffer({
      title: offerTitle,
      subtitle: offerSubtitle,
      type: offerType,
      validUntil: validUntil || "2026-12-31"
    });

    setOfferTitle("");
    setOfferSubtitle("");
    setValidUntil("");
    setShowAddOffer(false);
    setIsLoading(false);
  };

  return (
    <div className="p-8 space-y-8 text-left" id="offers-tab-wrapper">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif text-white uppercase tracking-wider font-extrabold">Aura Promotion & Discounts Engine</h2>
          <p className="text-xs text-neutral-400 font-light mt-1">
            Build, edit, and audit sensory discount codes, validation spending limits, and campaign offerings Cairo-wide.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="self-start sm:self-auto h-10 px-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-mono text-zinc-300 flex items-center gap-2 cursor-pointer transition-all"
        >
          <span>Refresh Discounts List</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* COUPONS SYSTEM MODULE (Left Column) */}
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-2.5">
              <Ticket className="w-5 h-5 text-[#D21B27]" />
              <h3 className="text-lg font-serif text-white uppercase tracking-wide">Active Validation Coupons</h3>
            </div>
            
            <button
              onClick={() => setShowAddCoupon(!showAddCoupon)}
              className="px-3 py-1.5 rounded-lg border border-[#D21B27]/30 hover:bg-[#D21B27] text-[10px] tracking-wider font-bold uppercase text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddCoupon ? "Close" : "Create Coupon"}</span>
            </button>
          </div>

          {/* Add Coupon Dialog Form Block */}
          {showAddCoupon && (
            <form onSubmit={handleCouponSubmit} className="p-5 border border-[#D21B27]/10 bg-gradient-to-br from-[#1F0D0F]/10 to-black rounded-2xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8.5px] font-mono uppercase text-zinc-400 mb-1 font-bold">Coupon Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AURA40"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/5 hover:border-white/10 focus:border-[#D21B27] rounded-lg p-2 text-xs text-stone-200 outline-none uppercase font-mono tracking-widest"
                  />
                </div>
                <div>
                  <label className="block text-[8.5px] font-mono uppercase text-zinc-400 mb-1 font-bold">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-lg p-2 text-xs text-stone-200 outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Value (EGP)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8.5px] font-mono uppercase text-zinc-400 mb-1 font-bold">Discount Value</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 20"
                    value={discountAmount}
                    onChange={e => setDiscountAmount(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/5 hover:border-white/10 focus:border-[#D21B27] rounded-lg p-2 text-xs text-stone-200 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[8.5px] font-mono uppercase text-zinc-400 mb-1 font-bold">Minimum Spend floor (EGP)</label>
                  <input
                    type="number"
                    placeholder="e.g. 300"
                    value={minSpend}
                    onChange={e => setMinSpend(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/5 hover:border-white/10 focus:border-[#D21B27] rounded-lg p-2 text-xs text-stone-200 outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 rounded-xl bg-[#D21B27] hover:bg-[#B0151E] text-white text-[10px] tracking-widest font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Authorize & Activate Coupon</span>
              </button>
            </form>
          )}

          {/* Coupon Grid Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredCoupons.length === 0 ? (
              <div className="col-span-2 p-8 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                <p className="text-xs text-neutral-500 font-light">No promotion coupons match your active search filter.</p>
              </div>
            ) : (
              filteredCoupons.map(cop => (
              <div 
                key={cop.id}
                className="p-5 border border-white/[0.04] bg-white/[0.01]/60 rounded-2xl flex flex-col justify-between hover:border-[#D21B27]/25 transition-all text-left group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="px-2 py-0.5 bg-[#D21B27]/10 border border-[#D21B27]/20 text-[#D21B27] font-mono tracking-widest font-bold uppercase text-[9.5px] rounded">
                      {cop.code}
                    </span>
                    <h4 className="text-xl font-mono text-white font-extrabold mt-3.5">
                      {cop.discountType === "percentage" ? `${cop.amount}% OFF` : `${cop.amount} EGP OFF`}
                    </h4>
                  </div>
                  <button
                    onClick={() => {
                      if (true) {
                        onDeleteCoupon(cop.id);
                      }
                    }}
                    className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Delete Coupon"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="pt-3 border-t border-white/[0.04] flex justify-between items-center text-[10.5px] text-zinc-450 font-light">
                  <span>Min Floor: <span className="font-mono text-white font-bold">{cop.minSpend} EGP</span></span>
                  <span className="font-mono text-emerald-450 font-bold">Used {cop.usedCount} times</span>
                </div>
              </div>
            )))}
          </div>
        </div>

        {/* COMPAIGN OFFERS MODULE (Right Column) */}
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-serif text-white uppercase tracking-wide">Live Offer Campaigns</h3>
            </div>
            
            <button
              onClick={() => setShowAddOffer(!showAddOffer)}
              className="px-3 py-1.5 rounded-lg border border-emerald-500/30 hover:bg-emerald-600 text-[10px] tracking-wider font-bold uppercase text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddOffer ? "Close" : "Create Campaign"}</span>
            </button>
          </div>

          {/* Add Offer Dialog Form Block */}
          {showAddOffer && (
            <form onSubmit={handleOfferSubmit} className="p-5 border border-emerald-500/15 bg-gradient-to-br from-emerald-900/10 to-black rounded-2xl space-y-4">
              <div>
                <label className="block text-[8.5px] font-mono uppercase text-zinc-400 mb-1 font-bold">Campaign Banner Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midsummer Solid pairing combo"
                  value={offerTitle}
                  onChange={e => setOfferTitle(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 hover:border-white/10 focus:border-emerald-500 rounded-lg p-2 text-xs text-stone-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[8.5px] font-mono uppercase text-zinc-400 mb-1 font-bold">Details Description Subtext</label>
                <textarea
                  placeholder="Explain eligibility levels or complementary sensory details..."
                  value={offerSubtitle}
                  onChange={e => setOfferSubtitle(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 hover:border-white/10 focus:border-emerald-500 rounded-lg p-2 text-xs h-16 text-stone-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8.5px] font-mono uppercase text-zinc-400 mb-1 font-bold">Promotion Type</label>
                  <select
                    value={offerType}
                    onChange={e => setOfferType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-lg p-2 text-xs text-stone-200 outline-none"
                  >
                    <option value="DISCOUNT">Direct Discount</option>
                    <option value="BOGO">BOGO (Buy 1 Get 1)</option>
                    <option value="BUNDLE">Bundle Special</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8.5px] font-mono uppercase text-zinc-400 mb-1 font-bold">Valid Until Date</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={e => setValidUntil(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/5 hover:border-white/10 focus:border-emerald-500 rounded-lg p-2 text-xs text-stone-200 outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] tracking-widest font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Publish Promo Campaign</span>
              </button>
            </form>
          )}

          {/* Offer list campaigns */}
          <div className="space-y-4">
            {filteredOffers.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                <p className="text-xs text-neutral-500 font-light">No custom offer campaigns match your active search filter.</p>
              </div>
            ) : (
              filteredOffers.map(off => (
              <div 
                key={off.id}
                className="p-5 border border-white/[0.04] bg-white/[0.01]/60 rounded-2xl flex justify-between items-start hover:border-emerald-500/25 transition-all text-left group"
              >
                <div className="space-y-1.5 flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded">
                      {off.type}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">Expires: {off.validUntil}</span>
                  </div>
                  <h4 className="text-md font-serif text-white uppercase tracking-wider font-extrabold">{off.title}</h4>
                  <p className="text-[11.5px] text-zinc-450 font-light leading-relaxed">{off.subtitle}</p>
                </div>

                <button
                  onClick={() => {
                    if (true) {
                      onDeleteOffer(off.id);
                    }
                  }}
                  className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0"
                  title="Purge Campaign"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )))}
          </div>

        </div>
      </div>
    </div>
  );
}
