'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import AuroraBackground from '../../components/AuroraBackground';
import { easeOutExpo } from '../../lib/motion';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validations = useMemo(() => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      name: name.trim().length > 0,
    };
  }, [password, email, name]);

  const allValid =
    validations.length &&
    validations.uppercase &&
    validations.lowercase &&
    validations.number &&
    validations.email &&
    validations.name;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) return;
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
      return;
    }
    // Registration succeeded — navigate separately so a navigation error
    // can't be reported as a registration failure.
    router.push('/');
  };

  const ValidationItem = ({ valid, label }: { valid: boolean; label: string }) => (
    <span className={`flex items-center gap-1.5 text-xs ${valid ? 'text-success' : 'text-muted-deep'}`}>
      {valid ? <Check size={12} /> : <X size={12} />}
      {label}
    </span>
  );

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
            CREATE ACCOUNT
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
              FULL NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className={`w-full h-12 px-4 bg-white/5 border rounded-md text-warm-white text-sm placeholder:text-muted-deep focus:outline-none focus:ring-2 transition-all ${
                name && !validations.name
                  ? 'border-crimson/50 focus:ring-crimson/10'
                  : 'border-glass-border focus:border-crimson/50 focus:ring-crimson/10'
              }`}
            />
          </div>

          <div>
            <label className="block font-display font-medium text-xs tracking-[0.08em] text-warm-white uppercase mb-2">
              EMAIL
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={`w-full h-12 px-4 pr-10 bg-white/5 border rounded-md text-warm-white text-sm placeholder:text-muted-deep focus:outline-none focus:ring-2 transition-all ${
                  email && !validations.email
                    ? 'border-crimson/50 focus:ring-crimson/10'
                    : 'border-glass-border focus:border-crimson/50 focus:ring-crimson/10'
                }`}
              />
              {email && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {validations.email ? (
                    <Check size={16} className="text-success" />
                  ) : (
                    <X size={16} className="text-crimson" />
                  )}
                </span>
              )}
            </div>
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
                placeholder="Min 8 characters"
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
            {/* Password requirements */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ValidationItem valid={validations.length} label="8+ characters" />
              <ValidationItem valid={validations.uppercase} label="Uppercase" />
              <ValidationItem valid={validations.lowercase} label="Lowercase" />
              <ValidationItem valid={validations.number} label="Number" />
            </div>
          </div>

          <button
            type="submit"
            disabled={!allValid || loading}
            className={`w-full h-12 font-display font-semibold text-sm tracking-[0.12em] uppercase rounded-sm transition-colors mt-2 ${
              allValid && !loading
                ? 'bg-crimson text-warm-white hover:bg-crimson-light'
                : 'bg-muted-deep/30 text-muted-deep cursor-not-allowed'
            }`}
          >
            {loading ? 'CREATING ACCOUNT…' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-crimson hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
