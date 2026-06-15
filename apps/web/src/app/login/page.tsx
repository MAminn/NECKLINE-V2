'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { safeInternalPath } from '../../lib/safeUrl';
import AuroraBackground from '../../components/AuroraBackground';
import { easeOutExpo } from '../../lib/motion';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = safeInternalPath(searchParams.get('returnUrl'));
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push(returnUrl || '/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-noir-deep flex items-center justify-center relative">
      <AuroraBackground variant="subtle" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
        className="relative z-10 w-full max-w-md mx-auto px-6 pt-24 pb-16"
      >
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <span className="text-crimson text-sm">&#9670;</span>
            <span className="font-display font-bold text-xl tracking-[-0.02em]">
              <span className="text-warm-white">NECK</span>
              <span className="text-crimson">LINE</span>
            </span>
          </Link>
          <h1 className="font-display font-bold text-3xl tracking-[-0.02em] text-warm-white uppercase">
            SIGN IN
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-error-bg border border-error-border text-error-fg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block font-display font-medium text-xs tracking-[0.08em] text-warm-white uppercase mb-2">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full h-12 px-4 bg-white/5 border border-glass-border rounded-md text-warm-white text-sm placeholder:text-muted-deep focus:outline-none focus:border-crimson/50 focus:ring-2 focus:ring-crimson/10 transition-all"
            />
          </div>

          <div>
            <label className="block font-display font-medium text-xs tracking-[0.08em] text-warm-white uppercase mb-2">
              PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full h-12 px-4 pr-12 bg-white/5 border border-glass-border rounded-md text-warm-white text-sm placeholder:text-muted-deep focus:outline-none focus:border-crimson/50 focus:ring-2 focus:ring-crimson/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-warm-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-crimson text-warm-white font-display font-semibold text-sm tracking-[0.12em] uppercase rounded-sm hover:bg-crimson-light transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'SIGNING IN…' : 'SIGN IN'}
          </button>
        </form>

        <div className="mt-8 text-center space-y-3">
          <p className="text-sm text-muted">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-crimson hover:underline">
              Create one
            </Link>
          </p>
          <Link href="/forgot-password" className="block text-sm text-muted hover:text-warm-white transition-colors">
            Forgot password?
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-noir-deep" />}>
      <LoginPageContent />
    </Suspense>
  );
}
