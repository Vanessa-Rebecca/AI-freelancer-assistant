import type { Request, RequestHandler } from 'express';
import { AppError } from '../utils/AppError.ts';
import { verifyAccessToken } from '../utils/tokens.ts';

// Checks the Bearer access token's signature and expiry (no database lookup)
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw AppError.unauthorized();

  const { sub, role } = verifyAccessToken(header.slice('Bearer '.length));
  req.user = { id: sub, role };
  next();
};

// For handlers behind requireAuth: returns req.user with a non-optional type
export function authUser(req: Request) {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}
