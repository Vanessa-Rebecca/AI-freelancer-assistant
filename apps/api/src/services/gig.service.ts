import type { Prisma } from '@prisma/client';
import { gigContentSchema } from '@afa/shared';
import type { GigInput, GigSaveInput, GigUpdateInput, ListQuery } from '@afa/shared';
import { buildGigPrompt } from '../ai/prompts/gig.v1.ts';
import { prisma } from '../db/prisma.ts';
import { AppError } from '../utils/AppError.ts';
import { preview } from '../utils/preview.ts';
import * as ai from './ai.service.ts';
import { logActivity } from './activity.service.ts';
import { getWriterProfile } from './writer-profile.service.ts';

const NOT_FOUND = 'Gig description not found';

// Returns editable sections only. Nothing is saved until the user saves them.
// The AI's JSON is checked with the same schema the user's edits must pass on save.
export async function generateGig(userId: string, input: GigInput) {
  const writer = await getWriterProfile(userId);
  const spec = buildGigPrompt(input, writer);

  const result = await ai.generate(userId, 'GIG', spec, { parse: gigContentSchema });

  return {
    ...result.data,
    promptVersion: spec.version,
    model: result.model,
    creditsUsed: result.creditsUsed,
    creditsRemaining: result.creditsRemaining,
  };
}

export async function createGig(userId: string, input: GigSaveInput) {
  const gig = await prisma.gigDescription.create({ data: { userId, ...input } });
  await logActivity(userId, {
    type: 'CREATED',
    entityType: 'GIG',
    entityId: gig.id,
    summary: `Saved gig description for ${gig.category}`,
  });
  return gig;
}

// Every query below is scoped by userId: someone else's gig is a 404

export async function listGigs(userId: string, { q, page, pageSize }: ListQuery) {
  const where: Prisma.GigDescriptionWhereInput = {
    userId,
    ...(q && {
      OR: [
        { category: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { seoKeywords: { has: q.toLowerCase() } },
      ],
    }),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.gigDescription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        category: true,
        experienceLevel: true,
        deliveryDays: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.gigDescription.count({ where }),
  ]);

  return {
    items: rows.map(({ description, ...row }) => ({ ...row, preview: preview(description) })),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getGig(userId: string, id: string) {
  const gig = await prisma.gigDescription.findFirst({ where: { id, userId } });
  if (!gig) throw AppError.notFound(NOT_FOUND);
  return gig;
}

export async function updateGig(userId: string, id: string, input: GigUpdateInput) {
  const { count } = await prisma.gigDescription.updateMany({ where: { id, userId }, data: input });
  if (count === 0) throw AppError.notFound(NOT_FOUND);
  const gig = await getGig(userId, id);
  await logActivity(userId, {
    type: 'UPDATED',
    entityType: 'GIG',
    entityId: id,
    summary: `Edited gig description for ${gig.category}`,
  });
  return gig;
}

export async function deleteGig(userId: string, id: string) {
  // Read the details first: the timeline entry has to outlive the gig
  const gig = await prisma.gigDescription.findFirst({
    where: { id, userId },
    select: { category: true },
  });
  if (!gig) throw AppError.notFound(NOT_FOUND);

  const { count } = await prisma.gigDescription.deleteMany({ where: { id, userId } });
  if (count === 0) throw AppError.notFound(NOT_FOUND);
  await logActivity(userId, {
    type: 'DELETED',
    entityType: 'GIG',
    entityId: id,
    summary: `Deleted gig description for ${gig.category}`,
  });
}
