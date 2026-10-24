import type { Currency } from '../money.ts';
import type { PriceBreakdownText } from '../pricing.ts';
import type { Complexity, ExtraCharge, Urgency } from '../schemas/pricing.ts';

// Amounts are decimal strings ("1027.75") so they are never rounded in transit
export type PricingEstimate = {
  id: string;
  title: string;
  currency: Currency;
  hourlyRate: string;
  hours: string;
  complexity: Complexity;
  urgency: Urgency;
  extras: ExtraCharge[];
  taxRate: string | null;
  breakdown: PriceBreakdownText;
  // Shape defined with AI pricing suggestions (Step 3.7)
  aiSuggestion: unknown;
  createdAt: string;
  updatedAt: string;
};

export type PricingEstimateSummary = Pick<
  PricingEstimate,
  'id' | 'title' | 'currency' | 'complexity' | 'urgency' | 'createdAt'
> & { total: string };
