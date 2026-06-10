'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginForm from '../../components/LoginForm';
import { safeInternalPath } from '../../lib/safeUrl';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = safeInternalPath(searchParams.get('returnUrl'));

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 font-display text-2xl uppercase tracking-widest text-text-primary">
        Sign In
      </h1>
      <LoginForm onSuccess={() => router.push(returnUrl)} />
      <div className="mt-6 text-center text-sm text-text-secondary">
        <p>
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-text-primary underline">
            Create one
          </a>
        </p>
        <p className="mt-2">
          <a href="/forgot-password" className="text-text-primary underline">
            Forgot password?
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-12"><p className="text-text-secondary">Loading...</p></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
