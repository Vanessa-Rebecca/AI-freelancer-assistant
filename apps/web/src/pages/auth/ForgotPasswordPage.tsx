import { useState } from 'react';
import { Link } from 'react-router';
import { forgotPasswordSchema } from '@afa/shared';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Field.tsx';
import { api } from '../../lib/api.ts';
import { useZodForm } from '../../lib/useZodForm.ts';
import { AuthLayout, FormAlert, linkClass } from './AuthLayout.tsx';

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useZodForm(forgotPasswordSchema, async (data) => {
    await api('/auth/forgot-password', { method: 'POST', body: data });
    setSentTo(data.email);
  });

  const backToLogin = (
    <Link to="/login" className={linkClass}>
      Back to log in
    </Link>
  );

  if (sentTo) {
    // Same message whether or not the account exists, matching the API
    return (
      <AuthLayout title="Check your email" footer={backToLogin}>
        <p role="status" className="text-sm leading-relaxed text-muted">
          If an account exists for <strong className="text-foreground">{sentTo}</strong>, we've sent
          a link to reset your password. It expires in 30 minutes.
        </p>
        <Button variant="secondary" className="mt-6 w-full" onClick={() => setSentTo(null)}>
          Use a different email
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link"
      footer={backToLogin}
    >
      <FormAlert message={form.formError} />
      <form onSubmit={form.handleSubmit} noValidate className="space-y-4">
        <Input {...form.field('email')} label="Email" type="email" autoComplete="email" />
        <Button type="submit" loading={form.submitting} className="w-full">
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
}
