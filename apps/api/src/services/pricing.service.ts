import type { PricingEstimate as PricingRow, Prisma } from '@prisma/client';
import { breakdownToText, calculatePrice, fromCents, pricingSuggestionSchema } from '@afa/shared';
import type {
  Currency,
  ExtraCharge,
  ListQuery,
  PricingEstimate,
  PricingInput,
  PricingProjectInput,
  PricingSaveInput,
  PricingSuggestion,
} from '@afa/shared';
import { buildPricingPrompt } from '../ai/prompts/pricing.v1.ts';
import { prisma } from '../db/prisma.ts';
import { AppError } from '../utils/AppError.ts';
import * as ai from './ai.service.ts';
import { logActivity } from './activity.service.ts';
import { getWriterProfile } from './writer-profile.service.ts';

const NOT_FOUND = 'Price estimate not found';

// Free and instant: the same calculation the page runs live
export function calculate(input: PricingInput) {
  return breakdownToText(calculatePrice(input));
}

// AI second opinion on the user's own price. Costs a credit; nothing is saved
// until the estimate is (the suggestion is then stored with it).
export async function suggest(userId: string, input: PricingProjectInput) {
  const writer = await getWriterProfile(userId);
  const spec = buildPricingPrompt(input, calculatePrice(input), writer);

  const result = await ai.generate(userId, 'PRICING', spec, { parse: pricingSuggestionSchema });

  return {
    suggestion: result.data,
    promptVersion: spec.version,
    model: result.model,
    creditsUsed: result.creditsUsed,
    creditsRemaining: result.creditsRemaining,
  };
}

// The client sends inputs only; the totals stored are always the server's own
export async function saveEstimate(
  userId: string,
  { title, description, aiSuggestion, ...input }: PricingSaveInput,
) {
  const price = calculatePrice(input);
  const row = await prisma.pricingEstimate.create({
    data: {
      userId,
      title,
      description: description ?? null,
      ...(aiSuggestion && { aiSuggestion }),
      currency: input.currency,
      hourlyRate: input.hourlyRate,
      hours: input.hours,
      complexity: input.complexity,
      urgency: input.urgency,
      // Normalised to 2 places, like every other amount ("120" -> "120.00")
      extras: breakdownToText(price).extras,
      taxRate: input.taxRate ?? null,
      subtotal: fromCents(price.subtotal),
      tax: fromCents(price.tax),
      total: fromCents(price.total),
    },
  });
  await logActivity(userId, {
    type: 'CREATED',
    entityType: 'PRICING',
    entityId: row.id,
    summary: `Saved price estimate for ${title} (${row.currency} ${row.total.toFixed(2)})`,
  });
  return toEstimate(row);
}

// Every query below is scoped by userId: someone else's estimate is a 404

export async function listEstimates(userId: string, { q, page, pageSize }: ListQuery) {
  const where: Prisma.PricingEstimateWhereInput = {
    userId,
    ...(q && { title: { contains: q, mode: 'insensitive' } }),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.pricingEstimate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        currency: true,
        complexity: true,
        urgency: true,
        total: true,
        createdAt: true,
      },
    }),
    prisma.pricingEstimate.count({ where }),
  ]);

  return {
    items: rows.map((r) => ({
      ...r,
      currency: r.currency as Currency,
      total: r.total.toFixed(2),
    })),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getEstimate(userId: string, id: string) {
  const row = await prisma.pricingEstimate.findFirst({ where: { id, userId } });
  if (!row) throw AppError.notFound(NOT_FOUND);
  return toEstimate(row);
}

export async function deleteEstimate(userId: string, id: string) {
  // Read the details first: the timeline entry has to outlive the estimate
  const row = await prisma.pricingEstimate.findFirst({
    where: { id, userId },
    select: { title: true },
  });
  if (!row) throw AppError.notFound(NOT_FOUND);

  const { count } = await prisma.pricingEstimate.deleteMany({ where: { id, userId } });
  if (count === 0) throw AppError.notFound(NOT_FOUND);
  await logActivity(userId, {
    type: 'DELETED',
    entityType: 'PRICING',
    entityId: id,
    summary: `Deleted price estimate for ${row.title}`,
  });
}

// Decimals leave the API as fixed 2-place strings ("500.00"), never floats
function toEstimate(row: PricingRow): PricingEstimate {
  const input: PricingInput = {
    currency: row.currency as Currency,
    hourlyRate: row.hourlyRate.toFixed(2),
    hours: row.hours.toFixed(2),
    complexity: row.complexity,
    urgency: row.urgency,
    extras: row.extras as ExtraCharge[],
    taxRate: row.taxRate?.toFixed(2),
  };
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    ...input,
    taxRate: input.taxRate ?? null,
    breakdown: {
      ...breakdownToText(calculatePrice(input)),
      // The stored figures are what was quoted
      subtotal: row.subtotal.toFixed(2),
      tax: row.tax.toFixed(2),
      total: row.total.toFixed(2),
    },
    // Validated with pricingSuggestionSchema before it was stored
    aiSuggestion: row.aiSuggestion as PricingSuggestion | null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
