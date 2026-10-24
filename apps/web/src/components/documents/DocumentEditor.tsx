import { useId, useLayoutEffect, useRef } from 'react';
import { cn } from '../../lib/cn.ts';

type DocumentEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  // True while the AI is writing: locks the box and tells assistive tech to wait
  busy?: boolean;
  placeholder?: string;
  error?: string;
};

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

// Plain-text editor that grows with its content, with word/character counts
export function DocumentEditor({
  label,
  value,
  onChange,
  maxLength = 20_000,
  busy = false,
  placeholder,
  error,
}: DocumentEditorProps) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);

  // Grow to fit the text instead of showing a second scrollbar
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);

  const nearLimit = value.length > maxLength * 0.9;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        readOnly={busy}
        aria-busy={busy || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-count${error ? ` ${id}-error` : ''}`}
        placeholder={placeholder}
        rows={12}
        className={cn(
          'block min-h-64 w-full resize-none rounded-xl border bg-surface px-4 py-3 text-sm leading-relaxed',
          'focus:outline-2 focus:outline-primary',
          busy && 'animate-pulse cursor-progress text-muted',
          error ? 'border-danger' : 'border-border',
        )}
      />
      <div className="flex justify-between gap-4 text-xs">
        <span id={`${id}-error`} className="text-danger">
          {error}
        </span>
        <span
          id={`${id}-count`}
          aria-live="polite"
          className={nearLimit ? 'text-warning' : 'text-muted'}
        >
          {countWords(value).toLocaleString()} words · {value.length.toLocaleString()} /{' '}
          {maxLength.toLocaleString()} characters
        </span>
      </div>
    </div>
  );
}
