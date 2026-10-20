import { Prisma } from '@prisma/client';
import type { RegisterInput } from '@afa/shared';
import { prisma } from '../db/prisma.ts';
import { AppError } from '../utils/AppError.ts';
import { hashPassword } from '../utils/password.ts';

// The only user fields ever sent to the client. passwordHash is never selected.
export const publicUserSelect = {
  id: true,
  email: true,
  emailVerifiedAt: true,
  aiCredits: true,
  role: true,
  createdAt: true,
  profile: { select: { fullName: true, avatarUrl: true } },
} satisfies Prisma.UserSelect;

const EMAIL_TAKEN = 'An account with this email already exists';

export async function registerUser({ fullName, email, password }: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw AppError.conflict(EMAIL_TAKEN);

  const passwordHash = await hashPassword(password);

  try {
    // Nested create runs in a single transaction: all three rows or none
    return await prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: { create: { fullName } },
        settings: { create: {} },
      },
      select: publicUserSelect,
    });
  } catch (err) {
    // Two simultaneous sign-ups with the same email: the unique index wins
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw AppError.conflict(EMAIL_TAKEN);
    }
    throw err;
  }
}
