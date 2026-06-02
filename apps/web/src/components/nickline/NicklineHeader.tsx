/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { ShoppingBag, Compass } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import ProfileDropdown, { UserProfile } from "./ProfileDropdown";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onOpenQuiz?: () => void;
  onOpenAdmin?: () => void;
}

export default function NicklineHeader({
  onOpenQuiz,
  onOpenAdmin
}: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { cart, openDrawer } = useCart();
  const router = useRouter();
  const cartCount = cart.itemCount;
  const currentUser: UserProfile | null = isAuthenticated && user ? {
    name: user.name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    role: user.role === 'admin' ? 'admin' : 'customer'
  } : null;

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem("aura_admin_token");
      localStorage.removeItem("aura_admin_user");
      window.location.reload();
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  return (
    <header className="sticky top-0 z-40 transition-all duration-300 bg-opacity-95 backdrop-blur-md border-b select-none
      dark:bg-black/90 dark:border-red-950/20 light:bg-[#FAF8F5]/90 light:border-stone-200"
      id="neckline-main-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 relative">
          
          {/* LOGO */}
          <div 
            className="flex items-center gap-1.5 cursor-pointer group"
            onClick={() => router.push("/")}
            id="header-brand-logo"
            title="Neckline Home"
          >
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-serif text-[#D21B27] dark:text-[#D21B27] tracking-[0.2em] font-medium group-hover:opacity-90 transition-opacity flex items-center gap-2">
                <span className="text-[#D21B27] text-lg">✦</span>
                NECKLINE
              </span>
            </div>
          </div>

          {/* MIDDLE NAV */}
          <nav className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center divide-x divide-neutral-500/30" id="header-nav-menu">
            <button
              onClick={() => router.push("/shop")}
              className="px-6 text-xs uppercase tracking-[0.25em] font-medium transition-colors cursor-pointer
                dark:text-neutral-300 dark:hover:text-[#D21B27] light:text-neutral-700 light:hover:text-[#D21B27]"
              id="nav-link-shop"
            >
              Shop Scents
            </button>
            <button
              onClick={() => router.push("/#story")}
              className="px-6 text-xs uppercase tracking-[0.25em] font-medium transition-colors cursor-pointer
                dark:text-neutral-300 dark:hover:text-[#D21B27] light:text-neutral-700 light:hover:text-[#D21B27]"
              id="nav-link-about"
            >
              Our Story
            </button>
            <button
              onClick={onOpenQuiz}
              className="px-6 text-xs uppercase tracking-[0.25em] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-[#D21B27]"
              id="nav-link-ritual"
              title="Explore your custom matched Neckline aura"
            >
              <Compass className="w-5 h-5 animate-spin-slow text-[#D21B27]" />
              Scent Finder
            </button>
            <button
              onClick={() => router.push("/#reviews")}
              className="px-6 text-xs uppercase tracking-[0.25em] font-medium transition-colors cursor-pointer
                dark:text-neutral-300 dark:hover:text-[#D21B27] light:text-neutral-700 light:hover:text-[#D21B27]"
              id="nav-link-reviews"
            >
              Reviews
            </button>
          </nav>

          {/* RIGHT UTILITIES */}
          <div className="flex items-center space-x-6" id="header-actions">

            {/* Profile Signpost (Aesthetic) */}
            <div className="relative">
              <ProfileDropdown 
                user={currentUser} 
                onLogout={handleLogout} 
                onOpenAdmin={onOpenAdmin} 
              />
            </div>

            {/* Interactive Cart Button */}
            <button
              onClick={openDrawer}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 select-none cursor-pointer
                dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:border dark:border-zinc-800
                light:bg-stone-100 light:hover:bg-stone-200 light:border light:border-stone-200"
              id="nav-item-cart"
              title="Open Sensory Bag"
            >
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium font-serif-neckline
                dark:text-neutral-300 dark:group-hover:text-white light:text-stone-800 light:group-hover:text-black"
              >
                CART ({cartCount})
              </span>
              <div className="w-7 h-7 bg-[#D21B27] hover:bg-[#B0151E] flex items-center justify-center rounded-full text-white shadow-md transition-transform group-hover:scale-105">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
