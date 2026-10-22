import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

type CardProps = ComponentProps<'section'> & {
  title?: string;
  description?: string;
  actions?: ReactNode;
};

export function Card({ title, description, actions, className, children, ...props }: CardProps) {
  return (
    <section
      className={cn('rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6', className)}
      {...props}
    >
      {(title || actions) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
