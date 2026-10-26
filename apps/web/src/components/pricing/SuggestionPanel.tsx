import { formatMoney, pricePosition, toHundredths } from '@afa/shared';
import type { PricePosition, PricingSuggestion } from '@afa/shared';
import { cn } from '../../lib/cn.ts';

const positionText: Record<PricePosition, { label: string; className: string }> = {
  BELOW: { label: 'Below the range', className: 'bg-warning/15 text-warning' },
  WITHIN: { label: 'Within the range', className: 'bg-success/15 text-success' },
  ABOVE: { label: 'Above the range', className: 'bg-primary/10 text-primary' },
};

type SuggestionPanelProps = {
  suggestion: PricingSuggestion;
  currency: string;
  // The user's current price before tax, compared with the range
  subtotal: number;
  // The inputs changed after this suggestion was made
  stale?: boolean;
};

export function SuggestionPanel({ suggestion, currency, subtotal, stale }: SuggestionPanelProps) {
  const { priceRange, deliveryDays } = suggestion;
  const position = positionText[pricePosition(subtotal, priceRange)];
  const days =
    deliveryDays.min === deliveryDays.max
      ? `${deliveryDays.min} days`
      : `${deliveryDays.min}–${deliveryDays.max} days`;

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-surface-muted px-3 py-2 text-xs text-muted">
        AI estimate from general market knowledge, not live market data. Use it as a second opinion.
      </p>
      {stale && (
        <p role="status" className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
          Your inputs changed after this suggestion. Get a fresh one to save it with the estimate.
        </p>
      )}

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium tracking-wide text-muted uppercase">
            Suggested range (before tax)
          </dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">
            {formatMoney(toHundredths(priceRange.low), currency)} –{' '}
            {formatMoney(toHundredths(priceRange.high), currency)}
          </dd>
          <dd className="mt-1">
            <span
              className={cn('rounded-full px-2 py-0.5 text-xs font-medium', position.className)}
            >
              Your {formatMoney(subtotal, currency)}: {position.label.toLowerCase()}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium tracking-wide text-muted uppercase">
            Recommended delivery
          </dt>
          <dd className="mt-1 text-lg font-semibold">{days}</dd>
        </div>
      </dl>

      <div>
        <h3 className="text-sm font-medium">Market positioning</h3>
        <p className="mt-1 text-sm text-muted">{suggestion.positioning}</p>
      </div>
      <div>
        <h3 className="text-sm font-medium">Tips</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
          {suggestion.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
