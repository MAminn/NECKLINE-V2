'use client';

import { useSearchParams } from 'next/navigation';
import PasswordResetConfirmForm from '../../components/PasswordResetConfirmForm';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <p className="text-text-secondary">Invalid or missing reset token.</p>
        <a href="/forgot-password" className="mt-4 inline-block text-text-primary underline">
          Request a new link
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 font-display text-2xl uppercase tracking-widest text-text-primary">
        Reset Password
      </h1>
      <PasswordResetConfirmForm token={token} />
    </div>
  );
}
