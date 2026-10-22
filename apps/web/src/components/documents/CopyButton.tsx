import { useEffect, useState } from 'react';
import { Button } from '../ui/Button.tsx';
import { useToast } from '../ui/Toast.tsx';

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard can be blocked by the browser; never claim success
      toast.error("Couldn't copy. Select the text and press Ctrl+C instead.");
    }
  };

  return (
    <Button variant="secondary" onClick={copy} disabled={!text}>
      <span aria-live="polite">{copied ? 'Copied!' : label}</span>
    </Button>
  );
}
