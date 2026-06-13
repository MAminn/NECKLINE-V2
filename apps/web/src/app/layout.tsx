import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus_Jakarta_Sans, Oswald, Cinzel } from 'next/font/google';
import '../styles/globals.css';
import { CartProvider } from '../contexts/CartContext';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import CartIcon from '../components/CartIcon';
import CartDrawer from '../components/CartDrawer';
import HeaderAuth from '../components/HeaderAuth';
import HeaderNav from '../components/HeaderNav';
import MobileMenu from '../components/MobileMenu';
import ToastContainer from '../components/ToastContainer';

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NECKLINE — Solid Perfume',
  description: 'A concentrated solid fragrance that melts with your pulse points.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${oswald.variable} ${cinzel.variable}`}
    >
      <body>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              {/* Header */}
              <header className="fixed left-0 right-0 top-0 z-sticky border-b border-border bg-bg-translucent backdrop-blur-md transition-colors duration-base gpu-layer">
                <div className="mx-auto flex max-w-container items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5 lg:py-4">

                  {/* Logo */}
                  <Link
                    href="/"
                    className="group flex items-center gap-2 shrink-0"
                    aria-label="Neckline home"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 12 12"
                      fill="currentColor"
                      className="text-primary transition-transform duration-200 group-hover:scale-110"
                      aria-hidden="true"
                    >
                      <path d="M6 0L12 6L6 12L0 6L6 0Z" />
                    </svg>
                    <span className="font-display text-xl lg:text-2xl uppercase tracking-[0.15em] text-text-primary transition-colors duration-200 group-hover:text-primary">
                      NECKLINE
                    </span>
                  </Link>

                  {/* Desktop Navigation */}
                  <HeaderNav />

                  {/* Right side: Auth + Cart */}
                  <div className="flex items-center gap-[10px]">
                    <div className="hidden sm:block">
                      <HeaderAuth />
                    </div>
                    <div className="hidden sm:block w-[3px] h-[3px] rounded-full bg-white/[0.18] shrink-0" aria-hidden="true" />
                    <CartIcon />
                    <MobileMenu />
                  </div>
                </div>
              </header>

              {/* Main content */}
              <div className="pt-[60px] lg:pt-[68px]">
                {children}
              </div>

              <CartDrawer />
              <ToastContainer />
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}