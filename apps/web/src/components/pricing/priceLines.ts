import {
  COMPLEXITY_PERCENT,
  URGENCY_PERCENT,
  complexityLabels,
  formatMoney,
  toHundredths,
  urgencyLabels,
} from '@afa/shared';
import type { PriceBreakdown, PricingInput } from '@afa/shared';

export type PriceLine = { label: string; amount: number; kind: 'line' | 'subtotal' | 'total' };

// Display only: "12.50" -> "12.5"
const plain = (decimal: string) => String(Number(decimal));

// The rows of a quote, in order. Adjustments of 0 are left out to keep it short.
export function priceLines(input: PricingInput, price: PriceBreakdown): PriceLine[] {
  const rate = formatMoney(toHundredths(input.hourlyRate), input.currency);
  const lines: PriceLine[] = [
    { label: `Base: ${plain(input.hours)} h × ${rate}`, amount: price.base, kind: 'line' },
  ];
  if (COMPLEXITY_PERCENT[input.complexity]) {
    lines.push({
      label: `Complexity: ${complexityLabels[input.complexity]}`,
      amount: price.complexity,
      kind: 'line',
    });
  }
  if (URGENCY_PERCENT[input.urgency]) {
    lines.push({
      label: `Urgency: ${urgencyLabels[input.urgency]}`,
      amount: price.urgency,
      kind: 'line',
    });
  }
  for (const e of price.extras) lines.push({ label: e.label, amount: e.amount, kind: 'line' });
  if (input.taxRate) {
    lines.push({ label: 'Subtotal', amount: price.subtotal, kind: 'subtotal' });
    lines.push({ label: `Tax (${plain(input.taxRate)}%)`, amount: price.tax, kind: 'line' });
  }
  lines.push({ label: 'Total', amount: price.total, kind: 'total' });
  return lines;
}

// Plain-text quote for copying and printing
export function quoteText(lines: PriceLine[], currency: string) {
  return lines.map((l) => `${l.label}: ${formatMoney(l.amount, currency)}`).join('\n');
}
