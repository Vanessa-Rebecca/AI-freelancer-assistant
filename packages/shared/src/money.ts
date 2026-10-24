// Money is handled as whole minor units (cents) so sums are exact:
// in floating point 0.1 + 0.2 is 0.30000000000000004, in cents 10 + 20 is 30.

// Currencies offered in the app; all have 2 decimal places
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'KES', 'NGN', 'ZAR', 'INR'] as const;
export type Currency = (typeof CURRENCIES)[number];

// "12", "12.5", "12.50" (and the number 12.5 from JSON); no signs, exponents or separators
export const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/;

/**
 * Exact conversion of a decimal string with up to 2 places to hundredths:
 * "19.99" -> 1999. Never goes through parseFloat, so there's no 0.29 * 100 = 28.999… error.
 */
export function toHundredths(value: string | number) {
  const text = String(value).trim();
  if (!DECIMAL_PATTERN.test(text)) throw new Error(`Not a decimal amount: ${text}`);
  const [whole = '0', fraction = ''] = text.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

// 1999 -> "19.99": a plain string, safe to store or send
export function fromCents(cents: number) {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/**
 * Round half up (away from zero) when dividing integers:
 * divideRounded(250, 100) = 3, divideRounded(249, 100) = 2.
 * Callers keep values far below 2^53, so integer maths stays exact.
 */
export function divideRounded(numerator: number, denominator: number) {
  const sign = Math.sign(numerator) * Math.sign(denominator);
  const n = Math.abs(numerator);
  const d = Math.abs(denominator);
  return sign * Math.floor((2 * n + d) / (2 * d));
}

// For display only: 123456 cents -> "$1,234.56" (or the locale's style)
export function formatMoney(cents: number, currency: string, locale?: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}
