import { randomBytes } from 'node:crypto';
import { Prisma, type Role } from '@prisma/client';
import type { LoginInput, RegisterInput } from '@afa/shared';
import { prisma } from '../db/prisma.ts';
import { AppError } from '../utils/AppError.ts';
import { hashPassword, verifyPassword } from '../utils/password.ts';
import { generateRefreshToken, hashToken, signAccessToken } from '../utils/tokens.ts';

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
const INVALID_LOGIN = 'Invalid email or password';

// Issues an access token and stores a new refresh token (one row per device)
async function createSession(userId: string, role: Role, userAgent?: string) {
  const refresh = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: refresh.tokenHash,
      expiresAt: refresh.expiresAt,
      userAgent: userAgent?.slice(0, 255),
    },
  });
  return {
    accessToken: signAccessToken({ sub: userId, role }),
    refreshToken: refresh.token,
    refreshExpiresAt: refresh.expiresAt,
  };
}

export async function registerUser(
  { fullName, email, password }: RegisterInput,
  userAgent?: string,
) {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw AppError.conflict(EMAIL_TAKEN);

  const passwordHash = await hashPassword(password);

  let user;
  try {
    // Nested create runs in a single transaction: all three rows or none
    user = await prisma.user.create({
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

  return { user, ...(await createSession(user.id, user.role, userAgent)) };
}

// Hash of a random password, checked when the email is unknown so that
// "no such user" takes as long as "wrong password". Computed in the background
// at startup so even the first unknown-email login isn't slower.
const dummyHash = hashPassword(randomBytes(16).toString('hex'));

export async function loginUser({ email, password }: LoginInput, userAgent?: string) {
  const found = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  const valid = await verifyPassword(password, found?.passwordHash ?? (await dummyHash));
  if (!found || !valid) throw AppError.unauthorized(INVALID_LOGIN);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: found.id },
    select: publicUserSelect,
  });
  return { user, ...(await createSession(user.id, user.role, userAgent)) };
}

const SESSION_EXPIRED = 'Session expired, please log in again';

// A revoked token seen again after this window means it was copied. Inside the
// window it's just two tabs refreshing at once, so we don't punish the user.
const REUSE_GRACE_MS = 10_000;

export async function revokeAllSessions(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// Rotation: each refresh token works once and is replaced by a new one
export async function refreshSession(token: string | undefined, userAgent?: string) {
  if (!token) throw AppError.unauthorized(SESSION_EXPIRED);

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, expiresAt: true, revokedAt: true },
  });
  if (!stored) throw AppError.unauthorized(SESSION_EXPIRED);

  if (stored.revokedAt) {
    if (Date.now() - stored.revokedAt.getTime() > REUSE_GRACE_MS) {
      await revokeAllSessions(stored.userId);
    }
    throw AppError.unauthorized(SESSION_EXPIRED);
  }
  if (stored.expiresAt <= new Date()) throw AppError.unauthorized(SESSION_EXPIRED);

  // Only succeeds if still active right now, so concurrent refreshes can't both win
  const { count } = await prisma.refreshToken.updateMany({
    where: { id: stored.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count === 0) throw AppError.unauthorized(SESSION_EXPIRED);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: stored.userId },
    select: publicUserSelect,
  });
  return { user, ...(await createSession(user.id, user.role, userAgent)) };
}

export async function logoutSession(token: string | undefined) {
  if (!token) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  // Valid token but the account is gone: treat as logged out
  if (!user) throw AppError.unauthorized();
  return user;
}
