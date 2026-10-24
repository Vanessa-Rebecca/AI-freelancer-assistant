import { useEffect, useRef } from 'react';

// Form-level message (wrong password, rate limited, server down, AI busy, out of credits).
// It sits at the top of the form, so it scrolls itself into view: on long forms the
// user is usually down at the submit button and would otherwise never see it.
export function FormAlert({ message }: { message: string | null }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [message]);

  if (!message) return null;
  return (
    <div
      ref={ref}
      role="alert"
      className="mb-4 scroll-mt-20 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm text-danger"
    >
      {message}
    </div>
  );
}
