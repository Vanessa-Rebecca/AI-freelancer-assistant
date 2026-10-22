import { Link } from 'react-router';
import { loginSchema } from '@afa/shared';
import { useAuth } from '../../auth/AuthContext.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Field.tsx';
import { useZodForm } from '../../lib/useZodForm.ts';
import { AuthLayout, FormAlert, linkClass } from './AuthLayout.tsx';

export function LoginPage() {
  const { login } = useAuth();
  // On success GuestRoute sends the user on to where they were going
  const form = useZodForm(loginSchema, login);

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <>
          New here?{' '}
          <Link to="/register" className={linkClass}>
            Create an account
          </Link>
        </>
      }
    >
      <FormAlert message={form.formError} />
      <form onSubmit={form.handleSubmit} noValidate className="space-y-4">
        <Input {...form.field('email')} label="Email" type="email" autoComplete="email" />
        <div className="space-y-1.5">
          <Input
            {...form.field('password')}
            label="Password"
            type="password"
            autoComplete="current-password"
          />
          <div className="text-right text-sm">
            <Link to="/forgot-password" className={linkClass}>
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" loading={form.submitting} className="w-full">
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
}
