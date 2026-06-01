import type { Metadata } from 'next';
import '../styles/globals.css';
import { CartProvider } from '../contexts/CartContext';
import { AuthProvider } from '../contexts/AuthContext';
import CartIcon from '../components/CartIcon';
import CartDrawer from '../components/CartDrawer';
import HeaderAuth from '../components/HeaderAuth';

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
            <header className="fixed left-0 right-0 top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
              <div className="mx-auto flex max-w-container items-center justify-between px-4 py-3">
                <a href="/" className="font-display text-lg uppercase tracking-widest text-text-primary">
                  NECKLINE
                </a>
                <nav className="flex items-center gap-4">
                  <a href="/" className="text-sm uppercase tracking-wide text-text-secondary transition-colors hover:text-text-primary">
                    Collection
                  </a>
                  <HeaderAuth />
                  <CartIcon />
                </nav>
              </div>
            </header>

            {/* Main content with header offset */}
            <div className="pt-14">
              {children}
            </div>

            <CartDrawer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
