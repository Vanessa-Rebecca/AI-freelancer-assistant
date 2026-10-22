import type { ActivityType, EntityType } from '@prisma/client';
import { prisma } from '../db/prisma.ts';
import { logger } from '../utils/logger.ts';

type ActivityInput = {
  type: ActivityType;
  entityType: EntityType;
  entityId?: string;
  summary: string;
};

// Adds a timeline entry. A failure here must never undo or fail the action
// being recorded, so errors are logged and swallowed.
export async function logActivity(
  userId: string,
  { type, entityType, entityId, summary }: ActivityInput,
) {
  try {
    await prisma.activity.create({
      data: { userId, type, entityType, entityId, summary: summary.slice(0, 255) },
    });
  } catch (err) {
    logger.error('Failed to record activity', err);
  }
}
