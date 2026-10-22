import { useId } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (control: {
    id: string;
    'aria-invalid': boolean | undefined;
    'aria-describedby': string | undefined;
    className: string;
  }) => ReactNode;
};

const controlClass = cn(
  'w-full rounded-lg border bg-surface px-3 text-sm text-foreground placeholder:text-muted',
  'focus:outline-2 focus:outline-offset-0 focus:outline-primary',
  'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70',
);

// Shared label + hint + error wrapper. Links them to the control so screen
// readers announce "Email, invalid, Enter a valid email address".
function Field({ label, hint, error, required, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required && (
          <span className="text-danger" aria-hidden>
            {' '}
            *
          </span>
        )}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        className: cn(controlClass, error ? 'border-danger' : 'border-border'),
      })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

type Common = { label: string; hint?: string; error?: string };

export function Input({
  label,
  hint,
  error,
  className,
  ...props
}: Common & ComponentProps<'input'>) {
  return (
    <Field label={label} hint={hint} error={error} required={props.required}>
      {(control) => (
        <input {...props} {...control} className={cn(control.className, 'h-10', className)} />
      )}
    </Field>
  );
}

export function Textarea({
  label,
  hint,
  error,
  className,
  rows = 4,
  ...props
}: Common & ComponentProps<'textarea'>) {
  return (
    <Field label={label} hint={hint} error={error} required={props.required}>
      {(control) => (
        <textarea
          rows={rows}
          {...props}
          {...control}
          className={cn(control.className, 'py-2 leading-relaxed', className)}
        />
      )}
    </Field>
  );
}

type SelectProps = Common &
  ComponentProps<'select'> & { options: { value: string; label: string }[]; placeholder?: string };

export function Select({
  label,
  hint,
  error,
  className,
  options,
  placeholder,
  ...props
}: SelectProps) {
  return (
    <Field label={label} hint={hint} error={error} required={props.required}>
      {(control) => (
        <select {...props} {...control} className={cn(control.className, 'h-10', className)}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
