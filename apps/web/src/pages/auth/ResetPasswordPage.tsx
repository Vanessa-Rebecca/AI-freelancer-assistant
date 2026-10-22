import { Link, useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import { passwordSchema } from '@afa/shared';
import { useAuth } from '../../auth/AuthContext.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Field.tsx';
import { useToast } from '../../components/ui/Toast.tsx';
import { api } from '../../lib/api.ts';
import { useZodForm } from '../../lib/useZodForm.ts';
import { AuthLayout, FormAlert, linkClass } from './AuthLayout.tsx';

const resetFormSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const toast = useToast();
  const { status, logout } = useAuth();

  const form = useZodForm(resetFormSchema, async ({ password }) => {
    await api('/auth/reset-password', { method: 'POST', body: { token, password } });
    // The server signed out every session; drop this browser's too
    if (status === 'authenticated') await logout();
    toast.success('Password updated. Please log in with your new password.');
    navigate('/login', { replace: true });
  });

  const requestNew = (
    <Link to="/forgot-password" className={linkClass}>
      Request a new link
    </Link>
  );

  if (!token) {
    return (
      <AuthLayout title="Invalid reset link" footer={requestNew}>
        <p className="text-sm text-muted">
          This link is missing its reset code. Open the link from your email again, or request a new
          one.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" footer={requestNew}>
      <FormAlert message={form.formError} />
      <form onSubmit={form.handleSubmit} noValidate className="space-y-4">
        <Input
          {...form.field('password')}
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number"
        />
        <Input
          {...form.field('confirmPassword')}
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
        />
        <Button type="submit" loading={form.submitting} className="w-full">
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
