import type { Prisma } from '@prisma/client';
import type { ListQuery, ProposalInput, ProposalSaveInput, ProposalUpdateInput } from '@afa/shared';
import { buildProposalPrompt } from '../ai/prompts/proposal.v1.ts';
import { prisma } from '../db/prisma.ts';
import { AppError } from '../utils/AppError.ts';
import * as ai from './ai.service.ts';
import { getWriterProfile } from './writer-profile.service.ts';

const NOT_FOUND = 'Proposal not found';
const PREVIEW_LENGTH = 160;

// Returns a draft only. Nothing is saved until the user edits and saves it.
export async function generateProposal(userId: string, input: ProposalInput) {
  const writer = await getWriterProfile(userId);
  const spec = buildProposalPrompt(input, writer);

  const result = await ai.generate(userId, 'PROPOSAL', spec);

  return {
    content: result.text.trim(),
    promptVersion: spec.version,
    model: result.model,
    creditsUsed: result.creditsUsed,
    creditsRemaining: result.creditsRemaining,
    // The model hit its length limit: the UI should offer to regenerate
    truncated: result.finishReason === 'MAX_TOKENS',
  };
}

export function createProposal(userId: string, input: ProposalSaveInput) {
  return prisma.proposal.create({ data: { userId, ...input } });
}

// Every query below is scoped by userId: another user's proposal is a 404,
// never a 403, so we don't even confirm that it exists.

export async function listProposals(userId: string, { q, page, pageSize }: ListQuery) {
  const where: Prisma.ProposalWhereInput = {
    userId,
    ...(q && {
      OR: [
        { projectTitle: { contains: q, mode: 'insensitive' } },
        { clientName: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ],
    }),
  };

  // One transaction so the page and the total never disagree
  const [rows, total] = await prisma.$transaction([
    prisma.proposal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        clientName: true,
        projectTitle: true,
        tone: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.proposal.count({ where }),
  ]);

  return {
    items: rows.map(({ content, ...row }) => ({ ...row, preview: preview(content) })),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getProposal(userId: string, id: string) {
  const proposal = await prisma.proposal.findFirst({ where: { id, userId } });
  if (!proposal) throw AppError.notFound(NOT_FOUND);
  return proposal;
}

export async function updateProposal(userId: string, id: string, input: ProposalUpdateInput) {
  // Matches nothing if the proposal belongs to someone else
  const { count } = await prisma.proposal.updateMany({ where: { id, userId }, data: input });
  if (count === 0) throw AppError.notFound(NOT_FOUND);
  return getProposal(userId, id);
}

export async function deleteProposal(userId: string, id: string) {
  const { count } = await prisma.proposal.deleteMany({ where: { id, userId } });
  if (count === 0) throw AppError.notFound(NOT_FOUND);
}

// First characters on a word boundary, with line breaks flattened
function preview(content: string) {
  const flat = content.replace(/\s+/g, ' ').trim();
  if (flat.length <= PREVIEW_LENGTH) return flat;
  const cut = flat.slice(0, PREVIEW_LENGTH);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : PREVIEW_LENGTH)}…`;
}
