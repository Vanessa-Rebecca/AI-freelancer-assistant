import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { env, isProduction } from '../config/env.ts';
import { AppError } from './AppError.ts';

// ---------- Access token: HS256 JWT ----------

export type AccessTokenPayload = { sub: string; role: Role };

// Fixed header: we never read the algorithm from the token itself,
// which rules out "alg: none" and algorithm-confusion attacks.
const JWT_HEADER = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString('base64url');
}

function sign(data: string) {
  return createHmac('sha256', env.JWT_ACCESS_SECRET).update(data).digest();
}

export function signAccessToken(payload: AccessTokenPayload) {
  const now = Math.floor(Date.now() / 1000);
  const body = base64url(
    JSON.stringify({ ...payload, iat: now, exp: now + env.ACCESS_TOKEN_TTL_SECONDS }),
  );
  return `${JWT_HEADER}.${body}.${sign(`${JWT_HEADER}.${body}`).toString('base64url')}`;
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const invalid = AppError.unauthorized('Invalid or expired access token');
  const [header, body, signature] = token.split('.');
  if (header !== JWT_HEADER || !body || !signature) throw invalid;

  const expected = sign(`${header}.${body}`);
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw invalid;

  let claims: { sub?: unknown; role?: unknown; exp?: unknown };
  try {
    claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    throw invalid;
  }
  if (typeof claims.exp !== 'number' || claims.exp <= Math.floor(Date.now() / 1000)) throw invalid;
  if (typeof claims.sub !== 'string' || (claims.role !== 'USER' && claims.role !== 'ADMIN')) {
    throw invalid;
  }
  return { sub: claims.sub, role: claims.role };
}

// ---------- Opaque tokens (refresh, password reset, email verification) ----------

// Random tokens are high-entropy, so a fast SHA-256 is enough (unlike passwords)
export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function generateOpaqueToken(ttlMs: number) {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + ttlMs) };
}

export function generateRefreshToken() {
  return generateOpaqueToken(env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

// ---------- Refresh token cookie ----------

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

export function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: REFRESH_COOKIE_PATH,
    expires: expiresAt,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: REFRESH_COOKIE_PATH,
  });
}

export function readRefreshCookie(req: Request) {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === REFRESH_COOKIE) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}
