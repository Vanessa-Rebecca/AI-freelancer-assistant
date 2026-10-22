import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

// Built on the native <dialog>: focus trap, Escape to close, inert background
// and focus restore all come from the browser.
export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Escape key and dialog.close() both end up here
      onClose={onClose}
      // A click on the backdrop lands on the <dialog> itself, not its content
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={cn(
        'm-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-border bg-surface p-0 text-foreground shadow-xl',
        'backdrop:bg-black/50',
        className,
      )}
    >
      <div className="p-6">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <div className="mt-3 text-sm text-muted">{children}</div>
      </div>
      {footer && (
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>
      )}
    </dialog>
  );
}
