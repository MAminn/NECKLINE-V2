import type { Metadata } from 'next';
import '../styles/globals.css';
import { CartProvider } from '../contexts/CartContext';
import { AuthProvider } from '../contexts/AuthContext';
import CartIcon from '../components/CartIcon';
import CartDrawer from '../components/CartDrawer';
import HeaderAuth from '../components/HeaderAuth';
import MobileMenu from '../components/MobileMenu';

export const metadata: Metadata = {
  title: 'NECKLINE — Solid Perfume',
  description: 'A concentrated solid fragrance that melts with your pulse points.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            {/* Header */}
            <header className="fixed left-0 right-0 top-0 z-[1100] border-b border-border bg-bg/95 backdrop-blur-md transition-colors duration-300 gpu-layer">
              <div className="mx-auto flex max-w-container items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5 lg:py-4">
                {/* Logo */}
                <a 
                  href="/" 
                  className="font-display text-xl lg:text-2xl uppercase tracking-[0.15em] text-text-primary hover:text-primary transition-colors duration-200 shrink-0"
                >
                  <span className="text-primary">✦</span> NECKLINE
                </a>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                  <a 
                    href="/shop" 
                    className="nav-link text-sm lg:text-base uppercase tracking-[0.12em] text-text-secondary transition-colors duration-200 hover:text-text-primary font-medium"
                  >
                    Shop
                  </a>
                  <a 
                    href="/#collection" 
                    className="nav-link text-sm lg:text-base uppercase tracking-[0.12em] text-text-secondary transition-colors duration-200 hover:text-text-primary font-medium"
                  >
                    Collection
                  </a>
                  <a 
                    href="/#how-to-apply" 
                    className="nav-link text-sm lg:text-base uppercase tracking-[0.12em] text-text-secondary transition-colors duration-200 hover:text-text-primary font-medium"
                  >
                    Ritual
                  </a>
                  <a 
                    href="/#reviews" 
                    className="nav-link text-sm lg:text-base uppercase tracking-[0.12em] text-text-secondary transition-colors duration-200 hover:text-text-primary font-medium"
                  >
                    Reviews
                  </a>
                </nav>

                {/* Right side: Auth + Cart */}
                <div className="flex items-center gap-3 lg:gap-5">
                  <div className="hidden sm:block">
                    <HeaderAuth />
                  </div>
                  <CartIcon />
                  <MobileMenu />
                </div>
              </div>
            </header>

            {/* Main content with header offset */}
            <div className="pt-[60px] lg:pt-[68px]">
              {children}
            </div>

            <CartDrawer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
