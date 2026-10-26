import type { Currency } from '../money.ts';
import type { PriceBreakdownText } from '../pricing.ts';
import type { Complexity, ExtraCharge, PricingSuggestion, Urgency } from '../schemas/pricing.ts';

// Amounts are decimal strings ("1027.75") so they are never rounded in transit
export type PricingEstimate = {
  id: string;
  title: string;
  description: string | null;
  currency: Currency;
  hourlyRate: string;
  hours: string;
  complexity: Complexity;
  urgency: Urgency;
  extras: ExtraCharge[];
  taxRate: string | null;
  breakdown: PriceBreakdownText;
  aiSuggestion: PricingSuggestion | null;
  createdAt: string;
  updatedAt: string;
};

export type PricingEstimateSummary = Pick<
  PricingEstimate,
  'id' | 'title' | 'currency' | 'complexity' | 'urgency' | 'createdAt'
> & { total: string };

// What /pricing/suggest returns; not saved until the estimate is
export type GeneratedPricingSuggestion = {
  suggestion: PricingSuggestion;
  promptVersion: string;
  model: string;
  creditsUsed: number;
  creditsRemaining: number;
};
