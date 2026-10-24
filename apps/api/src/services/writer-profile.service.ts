import type { WriterProfile } from '../ai/prompts/common.ts';
import { prisma } from '../db/prisma.ts';
import { AppError } from '../utils/AppError.ts';

// The profile details prompts may use, read fresh on every generation
export async function getWriterProfile(userId: string): Promise<WriterProfile> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: {
      fullName: true,
      title: true,
      bio: true,
      skills: true,
      hourlyRate: true,
      portfolioUrl: true,
      location: true,
    },
  });
  if (!profile) throw AppError.unauthorized();

  return {
    ...profile,
    // Decimal -> exact text ("45.00"), never a float
    hourlyRate: profile.hourlyRate?.toFixed(2) ?? null,
  };
}
