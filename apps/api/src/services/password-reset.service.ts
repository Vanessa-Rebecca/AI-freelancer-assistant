import type { ForgotPasswordInput, ResetPasswordInput } from '@afa/shared';
import { env } from '../config/env.ts';
import { prisma } from '../db/prisma.ts';
import { AppError } from '../utils/AppError.ts';
import { logger } from '../utils/logger.ts';
import { hashPassword } from '../utils/password.ts';
import { generateOpaqueToken, hashToken } from '../utils/tokens.ts';
import { revokeAllSessions } from './auth.service.ts';
import { sendEmail } from './email.service.ts';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const INVALID_LINK = 'This reset link is invalid or has expired. Please request a new one.';

// Returns immediately; the lookup, token and email happen in the background so
// the response time is the same whether or not the account exists.
export function requestPasswordReset({ email }: ForgotPasswordInput) {
  sendResetEmail(email).catch((err) => logger.error('Password reset email failed', err));
}

async function sendResetEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return;

  const { token, tokenHash, expiresAt } = generateOpaqueToken(RESET_TOKEN_TTL_MS);
  await prisma.$transaction([
    // Only the newest link works
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } }),
  ]);

  const link = `${env.CLIENT_ORIGIN}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Reset your AI Freelancer Assistant password',
    text: [
      'We received a request to reset your password.',
      `Reset it here (valid for 30 minutes): ${link}`,
      "If you didn't ask for this, you can ignore this email.",
    ].join('\n\n'),
  });
}

export async function resetPassword({ token, password }: ResetPasswordInput) {
  const stored = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!stored || stored.usedAt || stored.expiresAt <= new Date()) {
    throw AppError.badRequest(INVALID_LINK);
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    // Only succeeds if still unused right now, so the link can't be used twice
    const { count } = await tx.passwordResetToken.updateMany({
      where: { id: stored.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (count === 0) throw AppError.badRequest(INVALID_LINK);

    // Kill every other outstanding link too. Overlapping forgot-password requests
    // can leave more than one active, but only one reset may ever succeed.
    await tx.passwordResetToken.updateMany({
      where: { userId: stored.userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    await tx.user.update({ where: { id: stored.userId }, data: { passwordHash } });
  });

  // New password: sign out every device, including anyone who had access
  await revokeAllSessions(stored.userId);
}
