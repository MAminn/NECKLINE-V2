'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CartIcon from './CartIcon';
import HeaderAuth from './HeaderAuth';
import HeaderNav from './HeaderNav';
import MobileMenu from './MobileMenu';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={`fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center transition-all duration-300 ${
        scrolled
          ? 'bg-noir/80 backdrop-blur-xl border-b border-glass-border'
          : 'bg-transparent'
      }`}
    >
      <div className="w-full max-w-[1280px] mx-auto px-6 md:px-10 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-crimson text-sm">&#9670;</span>
          <span className="font-display font-bold text-xl tracking-[-0.02em]">
            <span className="text-warm-white">NECK</span>
            <span className="text-crimson">LINE</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <HeaderNav />

        {/* Right actions */}
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <HeaderAuth />
          </div>
          <CartIcon />
          <MobileMenu />
        </div>
      </div>
    </motion.header>
  );
}
