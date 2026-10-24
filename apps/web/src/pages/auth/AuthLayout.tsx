import type { ReactNode } from 'react';
import { Link } from 'react-router';
export { FormAlert } from '../../components/ui/FormAlert.tsx';

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

// Shared shell for the logged-out pages
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link to="/" className="mb-8 flex items-center gap-2 text-lg font-semibold">
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"
        >
          AI
        </span>
        Freelancer Assistant
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>

      {footer && <p className="mt-6 text-center text-sm text-muted">{footer}</p>}
    </main>
  );
}

export const linkClass = 'font-medium text-primary hover:underline';
