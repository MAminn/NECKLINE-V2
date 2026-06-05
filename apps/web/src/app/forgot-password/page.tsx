import PasswordResetForm from '../../components/PasswordResetForm';

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 font-display text-2xl uppercase tracking-widest text-text-primary">
        Forgot Password
      </h1>
      <PasswordResetForm />
      <div className="mt-6 text-center text-sm text-text-secondary">
        <a href="/login" className="text-text-primary underline">
          Back to login
        </a>
      </div>
    </div>
  );
}
