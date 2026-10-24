import type { DashboardStats } from '@afa/shared';
import { prisma } from '../db/prisma.ts';
import { AppError } from '../utils/AppError.ts';

type StatsRow = { proposals: bigint; activeClients: bigint; aiCredits: number | null };

// All widget numbers in one round trip to the database. $queryRaw with a
// tagged template sends userId as a bound parameter, never as SQL text.
// Each module adds its own sub-query here when its table arrives.
export async function getStats(userId: string): Promise<DashboardStats> {
  const [row] = await prisma.$queryRaw<StatsRow[]>`
    SELECT
      (SELECT count(*) FROM proposals WHERE "userId" = ${userId})                     AS "proposals",
      (SELECT count(*) FROM clients WHERE "userId" = ${userId} AND status = 'ACTIVE') AS "activeClients",
      (SELECT "aiCredits" FROM users WHERE id = ${userId})                            AS "aiCredits"
  `;
  if (!row || row.aiCredits === null) throw AppError.unauthorized();

  return {
    proposals: Number(row.proposals),
    coverLetters: 0, // Day 2
    activeClients: Number(row.activeClients),
    invoices: 0, // Day 4
    aiCredits: row.aiCredits,
  };
}

export function getRecentActivity(userId: string, limit: number) {
  return prisma.activity.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      type: true,
      entityType: true,
      entityId: true,
      summary: true,
      createdAt: true,
    },
  });
}
