'use client';

import { useRouter } from 'next/navigation';
import RegisterForm from '../../components/RegisterForm';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 font-display text-2xl uppercase tracking-widest text-text-primary">
        Create Account
      </h1>
      <RegisterForm onSuccess={() => router.push('/')} />
      <div className="mt-6 text-center text-sm text-text-secondary">
        <p>
          Already have an account?{' '}
          <a href="/login" className="text-text-primary underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
