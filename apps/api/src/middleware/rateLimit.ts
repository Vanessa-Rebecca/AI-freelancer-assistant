import type { Request, RequestHandler } from 'express';
import { AppError } from '../utils/AppError.ts';

type Options = {
  windowMs: number;
  max: number;
  // Defaults to the client IP
  key?: (req: Request) => string;
  // Only failed responses (status >= 400) use up the allowance
  failuresOnly?: boolean;
  // Used in the 429 message: "Too many <what>"
  what?: string;
};

// Fixed-window limiter kept in memory. Fine for a single server; with several
// instances the counts would need a shared store such as Redis.
export function rateLimit({ windowMs, max, key = clientIp, failuresOnly = false, what }: Options) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  // Drop expired windows so the map can't grow forever
  setInterval(() => {
    const now = Date.now();
    for (const [k, entry] of hits) if (entry.resetAt <= now) hits.delete(k);
  }, 60_000).unref();

  const handler: RequestHandler = (req, res, next) => {
    const now = Date.now();
    const k = key(req);
    let entry = hits.get(k);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(k, entry);
    }

    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      throw AppError.tooManyRequests(retryAfter, what);
    }

    // Count up front, refund on success: parallel requests can't all slip
    // through before the first failure is recorded.
    entry.count++;
    if (failuresOnly) {
      const counted = entry;
      res.on('finish', () => {
        if (res.statusCode < 400) counted.count = Math.max(0, counted.count - 1);
      });
    }
    next();
  };
  return handler;
}

export function clientIp(req: Request) {
  return req.ip ?? 'unknown';
}

// For routes behind requireAuth: count per account, not per network
export function userId(req: Request) {
  return req.user?.id ?? clientIp(req);
}

// IP + the email in the body, so one person's typos don't lock out a whole network
export function ipAndEmail(req: Request) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  return `${clientIp(req)}|${email}`;
}
