import type { Prisma } from '@prisma/client';
import type {
  CoverLetterInput,
  CoverLetterSaveInput,
  CoverLetterUpdateInput,
  ListQuery,
} from '@afa/shared';
import { buildCoverLetterPrompt } from '../ai/prompts/coverLetter.v1.ts';
import { prisma } from '../db/prisma.ts';
import { AppError } from '../utils/AppError.ts';
import { preview } from '../utils/preview.ts';
import * as ai from './ai.service.ts';
import { logActivity } from './activity.service.ts';
import { getWriterProfile } from './writer-profile.service.ts';

const NOT_FOUND = 'Cover letter not found';

// Returns a draft only. Nothing is saved until the user edits and saves it.
export async function generateCoverLetter(userId: string, input: CoverLetterInput) {
  const writer = await getWriterProfile(userId);
  const spec = buildCoverLetterPrompt(input, writer);

  const result = await ai.generate(userId, 'COVER_LETTER', spec);

  return {
    content: result.text.trim(),
    promptVersion: spec.version,
    model: result.model,
    creditsUsed: result.creditsUsed,
    creditsRemaining: result.creditsRemaining,
    truncated: result.finishReason === 'MAX_TOKENS',
  };
}

export async function createCoverLetter(userId: string, input: CoverLetterSaveInput) {
  const letter = await prisma.coverLetter.create({ data: { userId, ...input } });
  await logActivity(userId, {
    type: 'CREATED',
    entityType: 'COVER_LETTER',
    entityId: letter.id,
    summary: `Saved cover letter for ${letter.jobTitle} at ${letter.companyName}`,
  });
  return letter;
}

// Every query below is scoped by userId: someone else's letter is a 404

export async function listCoverLetters(userId: string, { q, page, pageSize }: ListQuery) {
  const where: Prisma.CoverLetterWhereInput = {
    userId,
    ...(q && {
      OR: [
        { jobTitle: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ],
    }),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.coverLetter.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        jobTitle: true,
        companyName: true,
        tone: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.coverLetter.count({ where }),
  ]);

  return {
    items: rows.map(({ content, ...row }) => ({ ...row, preview: preview(content) })),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getCoverLetter(userId: string, id: string) {
  const letter = await prisma.coverLetter.findFirst({ where: { id, userId } });
  if (!letter) throw AppError.notFound(NOT_FOUND);
  return letter;
}

export async function updateCoverLetter(userId: string, id: string, input: CoverLetterUpdateInput) {
  const { count } = await prisma.coverLetter.updateMany({ where: { id, userId }, data: input });
  if (count === 0) throw AppError.notFound(NOT_FOUND);
  const letter = await getCoverLetter(userId, id);
  await logActivity(userId, {
    type: 'UPDATED',
    entityType: 'COVER_LETTER',
    entityId: id,
    summary: `Edited cover letter for ${letter.jobTitle} at ${letter.companyName}`,
  });
  return letter;
}

export async function deleteCoverLetter(userId: string, id: string) {
  // Read the details first: the timeline entry has to outlive the letter
  const letter = await prisma.coverLetter.findFirst({
    where: { id, userId },
    select: { jobTitle: true, companyName: true },
  });
  if (!letter) throw AppError.notFound(NOT_FOUND);

  const { count } = await prisma.coverLetter.deleteMany({ where: { id, userId } });
  if (count === 0) throw AppError.notFound(NOT_FOUND);
  await logActivity(userId, {
    type: 'DELETED',
    entityType: 'COVER_LETTER',
    entityId: id,
    summary: `Deleted cover letter for ${letter.jobTitle} at ${letter.companyName}`,
  });
}
