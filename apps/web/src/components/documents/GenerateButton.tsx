import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import { Button } from '../ui/Button.tsx';
import { Icon } from '../ui/Icon.tsx';

type GenerateButtonProps = Omit<ComponentProps<typeof Button>, 'loading' | 'children'> & {
  generating: boolean;
  credits: number;
  label?: string;
};

// AI calls take a few seconds: a live timer shows progress instead of a silent spinner
export function GenerateButton({
  generating,
  credits,
  label = 'Generate with AI',
  ...props
}: GenerateButtonProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!generating) return;
    const started = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 250);
    return () => {
      clearInterval(timer);
      setSeconds(0);
    };
  }, [generating]);

  return (
    <Button loading={generating} {...props}>
      {generating ? (
        `Writing… ${seconds}s`
      ) : (
        <>
          <Icon name="sparkles" className="size-4" />
          {label}
          <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs dark:bg-white/15">
            {credits} credit{credits === 1 ? '' : 's'}
          </span>
        </>
      )}
    </Button>
  );
}
