/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from "react";
import { Scent } from "../../types/nickline";
import { Leaf, Lock, Heart, Sparkles, ChevronDown, ArrowLeft, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

interface ShopPageProps {
  onAddToCart: (scent: Scent) => void;
  onBackToHome: () => void;
  scents: Scent[];
  onOpenProduct: (scent: Scent) => void;
}

export default function ShopPage({ onAddToCart, onBackToHome, scents, onOpenProduct }: ShopPageProps) {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("Featured");
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  // Categories list exactly matching reference image
  const categories = [
    { label: "ALL", id: "ALL" },
    { label: "SIGNATURE SCENTS", id: "SIGNATURE" },
    { label: "LIMITED EDITION", id: "LIMITED" },
    { label: "BUNDLES", id: "BUNDLE" },
    { label: "ACCESSORIES", id: "ACCESSORY" }
  ];

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    return scents.filter((prod) => {
      const prodCategory = prod.category?.toLowerCase() || "";
      if (activeCategory === "ALL") return true;
      if (activeCategory === "SIGNATURE") return prodCategory === "signature";
      if (activeCategory === "BUNDLE") return prodCategory === "bundle";
      if (activeCategory === "LIMITED") return prodCategory === "limited";
      if (activeCategory === "ACCESSORY") return prodCategory === "accessory";
      return true;
    });
  }, [scents, activeCategory]);

  // Client-side sorting
  const sortedAndFilteredProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === "Price: Low to High") {
      return list.sort((a, b) => a.price - b.price);
    }
    if (sortBy === "Price: High to Low") {
      return list.sort((a, b) => b.price - a.price);
    }
    if (sortBy === "Alphabetical") {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list; // default "Featured"
  }, [filteredProducts, sortBy]);

  // Handle triggering add to cart
  const handleAddToCartClick = (prod: Scent) => {
    onAddToCart(prod);
  };

  const bannerFeatures = [
    {
      icon: <Leaf className="w-5 h-5 text-[#D21B27]" />,
      title: "CLEAN INGREDIENTS",
      description: "Made with skin-loving ingredients."
    },
    {
      icon: <Lock className="w-5 h-5 text-[#D21B27]" />,
      title: "DISCREET & PORTABLE",
      description: "Compact tin. No spills. Take it anywhere."
    },
    {
      icon: <Heart className="w-5 h-5 text-[#D21B27]" />,
      title: "MADE FOR INTIMACY",
      description: "Subtle. Seductive. Unforgettable."
    },
    {
      icon: <Sparkles className="w-5 h-5 text-[#D21B27]" />,
      title: "SATISFACTION GUARANTEED",
      description: "Love it or return it. No questions asked."
    }
  ];

  return (
    <div className="bg-[#070606] min-h-screen pt-4 pb-16 px-4 sm:px-6 lg:px-8 select-none" id="neckline-shop-page-view">
      
      {/* Upper Navigation Back Link */}
      <div className="max-w-7xl mx-auto mb-10 mt-4">
        <button 
          onClick={onBackToHome}
          className="group flex items-center gap-2 text-xs font-mono tracking-widest text-[#D21B27] uppercase hover:text-white transition-colors cursor-pointer"
          id="shop-back-to-home-btn"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-transform duration-200" />
          <span>Back to Homepage</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto">
        
        {/* SHOP TITLE BLOCK */}
        <div className="text-left mb-12" id="shop-title-header">
          <h1 className="text-5xl md:text-6xl font-sans font-black text-white uppercase tracking-[0.1em] leading-none mb-4">
            SHOP
          </h1>
          <p className="text-neutral-400 text-[13px] tracking-[0.05em] font-light leading-relaxed">
            Solid fragrances. Designed for intimacy. 
          </p>
          <p className="text-neutral-500 text-xs tracking-wide font-light mt-1">
            Choose your scent.
          </p>
        </div>

        {/* INTERACTIVE FILTER & SORT ROW */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/[0.06] pb-6 mb-10 gap-6" id="shop-filters-row">
          
          {/* Scent Categories (Left) */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-2" id="shop-category-selector">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                  }}
                  className={`text-[11px] tracking-[0.16em] font-medium py-2 px-4.5 transition-all uppercase rounded-md cursor-pointer ${
                    isActive 
                      ? "border border-[#D21B27] text-white bg-[#D21B27]/5" 
                      : "text-neutral-400 hover:text-white border border-transparent"
                  }`}
                  id={`shop-filter-${cat.id.toLowerCase()}`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Sort Menu Dropdown (Right) */}
          <div className="relative self-stretch md:self-auto" id="shop-sorting-component">
            <div className="flex items-center justify-end gap-3">
              <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 font-mono font-bold">
                SORT BY
              </span>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="border border-neutral-800 bg-[#0d090a] hover:bg-neutral-900 border-white/5 text-stone-100 px-4.5 py-2 text-[11px] tracking-widest uppercase flex items-center justify-between gap-3 rounded-lg cursor-pointer w-[200px]"
                id="shop-sort-toggle-btn"
              >
                <span>{sortBy}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {dropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-[200px] bg-neutral-950 border border-white/10 rounded-lg shadow-2xl z-30 py-1"
                id="shop-sort-dropdown-menu"
              >
                {["Featured", "Price: Low to High", "Price: High to Low", "Alphabetical"].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSortBy(option);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4.5 py-2 text-[11px] tracking-wider uppercase block hover:bg-[#D21B27]/10 transition-colors cursor-pointer ${
                      sortBy === option ? "text-[#D21B27] font-semibold" : "text-neutral-400"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PRODUCT CARDS LIST GRID */}
        {sortedAndFilteredProducts.length === 0 ? (
          <div className="py-24 text-center border border-white/5 rounded-2xl bg-[#090909]/40 mb-12">
            <p className="text-neutral-400 text-sm tracking-wider font-light">No products active under this ritual group.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16" id="shop-products-grid">
            {sortedAndFilteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="group relative flex flex-col justify-between p-4 bg-[#0a0607]/85 border border-white/[0.05] hover:border-[#D21B27]/25 transition-all duration-500 rounded-2xl h-[480px] cursor-pointer"
                id={`shop-product-card-${prod.id}`}
                onClick={() => onOpenProduct(prod)}
              >
                {/* Widescreen image card background inside matching container */}
                <div className="relative w-full h-[230px] rounded-xl overflow-hidden mb-5 shrink-0">
                  <img
                    src={prod.image}
                    alt={`${prod.name} product display`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  {/* Absolute dark overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070606]/50 to-transparent" />
                  
                  {/* Float subtle scent description profile accent */}
                  <div className="absolute bottom-2.5 left-3 bg-[#050505]/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[8px] font-mono uppercase tracking-widest text-neutral-400 border border-white/5">
                    {prod.bgProfileLabel}
                  </div>
                </div>

                {/* Scent Information Content */}
                <div className="flex flex-col text-left px-1 flex-grow mb-4">
                  <span className="text-[9px] tracking-[0.2em] font-bold text-[#D21B27] uppercase mb-1 block">
                    {prod.tag}
                  </span>
                  
                  <h3 className="text-white text-[15px] font-black tracking-[0.08em] uppercase font-sans mb-1.5 leading-tight">
                    {prod.name}
                  </h3>
                  
                  <p className="text-[11px] text-neutral-400 font-light leading-relaxed max-w-prose">
                    {prod.description}
                  </p>
                </div>

                {/* Pricing & Custom bright red Action button at the bottom */}
                <div className="flex flex-col gap-3.5 mt-auto">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[14px] font-bold tracking-wider text-white">
                      ${prod.price.toFixed(2)}
                    </span>
                    {prod.originalPrice && (
                      <span className="text-xs line-through text-neutral-500 font-light">
                        ${prod.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCartClick(prod);
                    }}
                    className="w-full py-3 bg-[#D21B27] hover:bg-[#E32B37] text-white text-[10px] tracking-[0.2em] font-extrabold uppercase transition-all duration-300 rounded-lg hover:shadow-[0_4px_20px_rgba(210,27,39,0.3)] cursor-pointer flex items-center justify-center gap-2 shrink-0"
                    title={`Add ${prod.name} to cart`}
                  >
                    <span>ADD TO CART</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BOTTOM FEATURES BANNER */}
        <div 
          className="border border-white/5 bg-[#0a0607]/85 backdrop-blur-xl rounded-2xl py-8 px-2 grid grid-cols-1 md:grid-cols-4 gap-y-6 md:gap-y-0 md:divide-x divide-white/[0.06] mb-8" 
          id="shop-features-banner"
        >
          {bannerFeatures.map((feat, index) => (
            <div
              key={index}
              className="flex items-center gap-4 px-6 select-none animate-fade-in"
              id={`shop-feature-column-${index}`}
            >
              <div className="w-11 h-11 rounded-full border border-neutral-800/80 flex items-center justify-center shrink-0">
                {feat.icon}
              </div>
              <div className="flex flex-col text-left">
                <h4 className="text-[10px] tracking-[0.16em] font-sans font-bold text-stone-100 uppercase mb-0.5">
                  {feat.title}
                </h4>
                <p className="text-[11px] text-neutral-400 font-light leading-normal max-w-prose">
                  {feat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
