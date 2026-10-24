import { z } from 'zod';
import { CURRENCIES, DECIMAL_PATTERN, toHundredths } from '../money.ts';

export const COMPLEXITIES = ['SIMPLE', 'MODERATE', 'COMPLEX'] as const;
export type Complexity = (typeof COMPLEXITIES)[number];

export const URGENCIES = ['NORMAL', 'RUSH', 'URGENT'] as const;
export type Urgency = (typeof URGENCIES)[number];

// Surcharge in whole percent: multipliers 1.0 / 1.25 / 1.5 and 1.0 / 1.2 / 1.5
export const COMPLEXITY_PERCENT: Record<Complexity, number> = {
  SIMPLE: 0,
  MODERATE: 25,
  COMPLEX: 50,
};
export const URGENCY_PERCENT: Record<Urgency, number> = { NORMAL: 0, RUSH: 20, URGENT: 50 };

export const complexityLabels: Record<Complexity, string> = {
  SIMPLE: 'Simple',
  MODERATE: 'Moderate (+25%)',
  COMPLEX: 'Complex (+50%)',
};
export const urgencyLabels: Record<Urgency, string> = {
  NORMAL: 'Normal',
  RUSH: 'Rush (+20%)',
  URGENT: 'Urgent (+50%)',
};

/**
 * A decimal amount with up to 2 places, kept as a string ("25.50") so it is never
 * rounded by floating point. Numbers from JSON are accepted and converted.
 */
type Bounds = { min: number; max: number };

// Zod runs every check even after one fails, so the range checks skip text the
// pattern already rejected (converting it would throw)
const inRange = (v: string, check: (hundredths: number) => boolean) =>
  !DECIMAL_PATTERN.test(v) || check(toHundredths(v));

const decimalText = (label: string, { min, max }: Bounds) =>
  z
    .string()
    .min(1, `${label} is required`)
    .regex(DECIMAL_PATTERN, `${label}: enter a number with up to 2 decimals, e.g. 25.50`)
    .refine((v) => inRange(v, (h) => h >= min * 100), `${label} must be at least ${min}`)
    .refine(
      (v) => inRange(v, (h) => h <= max * 100),
      `${label} must be at most ${max.toLocaleString('en')}`,
    );

const decimal = (label: string, bounds: Bounds) =>
  z
    .union([z.string(), z.number()], `${label} is required`)
    .transform((v) => String(v).trim())
    .pipe(decimalText(label, bounds));

export const extraChargeSchema = z.object({
  label: z
    .string('Describe the extra')
    .trim()
    .min(1, 'Describe the extra')
    .max(80, 'Keep the description under 80 characters'),
  amount: decimal('Amount', { min: 0, max: 1_000_000 }),
});

// The calculator's inputs. Bounds keep every intermediate value far below 2^53.
export const pricingInputSchema = z.object({
  currency: z.enum(CURRENCIES, 'Choose a currency'),
  hourlyRate: decimal('Hourly rate', { min: 0.01, max: 100_000 }),
  hours: decimal('Hours', { min: 0.01, max: 10_000 }),
  complexity: z.enum(COMPLEXITIES, 'Choose the complexity'),
  urgency: z.enum(URGENCIES, 'Choose the urgency'),
  extras: z.array(extraChargeSchema).max(20, 'Add at most 20 extras').default([]),
  // Percent, e.g. "16" or "7.5"; empty means no tax
  taxRate: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === undefined || String(v).trim() === '' ? undefined : String(v).trim()))
    .pipe(decimalText('Tax rate', { min: 0, max: 100 }).optional()),
});

export type ExtraCharge = z.infer<typeof extraChargeSchema>;
export type PricingInput = z.infer<typeof pricingInputSchema>;

// Saving: the inputs plus a name for the history list. Totals are never sent; the server calculates them.
export const pricingSaveSchema = pricingInputSchema.extend({
  title: z
    .string('Name the project')
    .trim()
    .min(1, 'Name the project')
    .max(120, 'Keep the project name under 120 characters'),
});

export type PricingSaveInput = z.infer<typeof pricingSaveSchema>;
