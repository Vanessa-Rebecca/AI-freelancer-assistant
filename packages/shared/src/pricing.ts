import { divideRounded, fromCents, toHundredths } from './money.ts';
import { COMPLEXITY_PERCENT, URGENCY_PERCENT } from './schemas/pricing.ts';
import type { PricingInput } from './schemas/pricing.ts';

// Every amount is in cents. The lines always add up exactly to the total.
export type PriceBreakdown = {
  base: number;
  complexity: number;
  urgency: number;
  extras: { label: string; amount: number }[];
  extrasTotal: number;
  subtotal: number;
  tax: number;
  total: number;
};

/**
 * Deterministic project price. Used live in the browser and again on the server
 * when saving, so a saved total can't be tampered with.
 *
 *   base       = rate × hours
 *   complexity = base × complexity %
 *   urgency    = (base + complexity) × urgency %     (so the multipliers compound)
 *   subtotal   = base + complexity + urgency + extras
 *   tax        = subtotal × tax %
 *   total      = subtotal + tax
 *
 * Each line is rounded half up to the cent once, so the table adds up to the total.
 */
export function calculatePrice(input: PricingInput): PriceBreakdown {
  // cents × hundredths of an hour / 100 = cents
  const base = divideRounded(toHundredths(input.hourlyRate) * toHundredths(input.hours), 100);
  const complexity = divideRounded(base * COMPLEXITY_PERCENT[input.complexity], 100);
  const urgency = divideRounded((base + complexity) * URGENCY_PERCENT[input.urgency], 100);

  const extras = input.extras.map((e) => ({ label: e.label, amount: toHundredths(e.amount) }));
  const extrasTotal = extras.reduce((sum, e) => sum + e.amount, 0);

  const subtotal = base + complexity + urgency + extrasTotal;
  // Tax rate is in hundredths of a percent ("7.5" -> 750), so divide by 100 × 100
  const tax = input.taxRate ? divideRounded(subtotal * toHundredths(input.taxRate), 10_000) : 0;

  return { base, complexity, urgency, extras, extrasTotal, subtotal, tax, total: subtotal + tax };
}

// The same breakdown with decimal strings ("1027.75"), as the API sends it
export type PriceBreakdownText = {
  [K in keyof PriceBreakdown]: K extends 'extras' ? { label: string; amount: string }[] : string;
};

export function breakdownToText(b: PriceBreakdown): PriceBreakdownText {
  return {
    base: fromCents(b.base),
    complexity: fromCents(b.complexity),
    urgency: fromCents(b.urgency),
    extras: b.extras.map((e) => ({ label: e.label, amount: fromCents(e.amount) })),
    extrasTotal: fromCents(b.extrasTotal),
    subtotal: fromCents(b.subtotal),
    tax: fromCents(b.tax),
    total: fromCents(b.total),
  };
}

export type PricePosition = 'BELOW' | 'WITHIN' | 'ABOVE';

/**
 * Where the user's price sits against an AI range. Plain maths, so the verdict
 * can't be wrong even if the AI's wording is. Compared before tax: tax isn't
 * part of the market price.
 */
export function pricePosition(subtotalCents: number, range: { low: string; high: string }) {
  if (subtotalCents < toHundredths(range.low)) return 'BELOW' satisfies PricePosition;
  if (subtotalCents > toHundredths(range.high)) return 'ABOVE' satisfies PricePosition;
  return 'WITHIN' satisfies PricePosition;
}
