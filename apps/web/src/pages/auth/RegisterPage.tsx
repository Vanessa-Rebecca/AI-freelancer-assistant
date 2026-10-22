import { Link } from 'react-router';
import { z } from 'zod';
import { registerSchema } from '@afa/shared';
import { useAuth } from '../../auth/AuthContext.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Field.tsx';
import { useToast } from '../../components/ui/Toast.tsx';
import { useZodForm } from '../../lib/useZodForm.ts';
import { AuthLayout, FormAlert, linkClass } from './AuthLayout.tsx';

// "Confirm password" only exists in the browser; the API gets registerSchema's fields
const registerFormSchema = registerSchema
  .extend({ confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const form = useZodForm(registerFormSchema, async ({ fullName, email, password }) => {
    await register({ fullName, email, password });
    toast.success(`Welcome, ${fullName}! Your account is ready.`);
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start writing proposals, invoices and more with AI"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className={linkClass}>
            Log in
          </Link>
        </>
      }
    >
      <FormAlert message={form.formError} />
      <form onSubmit={form.handleSubmit} noValidate className="space-y-4">
        <Input {...form.field('fullName')} label="Full name" autoComplete="name" />
        <Input {...form.field('email')} label="Email" type="email" autoComplete="email" />
        <Input
          {...form.field('password')}
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number"
        />
        <Input
          {...form.field('confirmPassword')}
          label="Confirm password"
          type="password"
          autoComplete="new-password"
        />
        <Button type="submit" loading={form.submitting} className="w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
