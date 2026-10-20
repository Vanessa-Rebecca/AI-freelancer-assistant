import { randomBytes } from 'node:crypto';
import { Prisma, type Role } from '@prisma/client';
import type { LoginInput, RegisterInput } from '@afa/shared';
import { prisma } from '../db/prisma.ts';
import { AppError } from '../utils/AppError.ts';
import { hashPassword, verifyPassword } from '../utils/password.ts';
import { generateRefreshToken, signAccessToken } from '../utils/tokens.ts';

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

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  // Valid token but the account is gone: treat as logged out
  if (!user) throw AppError.unauthorized();
  return user;
}
