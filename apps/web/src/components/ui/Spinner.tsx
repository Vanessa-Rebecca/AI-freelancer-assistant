import { cn } from '../../lib/cn.ts';

type SpinnerProps = { size?: 'sm' | 'md' | 'lg'; label?: string; className?: string };

const sizes = { sm: 'size-4 border-2', md: 'size-6 border-2', lg: 'size-10 border-4' };

export function Spinner({ size = 'md', label = 'Loading…', className }: SpinnerProps) {
  return (
    <span role="status" className={cn('inline-flex', className)}>
      <span
        aria-hidden
        className={cn(
          'animate-spin rounded-full border-current border-t-transparent opacity-80',
          sizes[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
