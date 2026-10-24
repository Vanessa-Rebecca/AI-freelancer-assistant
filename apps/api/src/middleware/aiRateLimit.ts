import { env } from '../config/env.ts';
import { rateLimit, userId } from './rateLimit.ts';

// One shared counter for every AI route, so the limit can't be multiplied by
// spreading requests across features. Every request counts: each one uses the
// app's provider quota, even when it fails. Mount after requireAuth.
export const aiRateLimit = rateLimit({
  windowMs: 60_000,
  max: env.AI_RATE_LIMIT_PER_MINUTE,
  key: userId,
  what: 'AI requests',
});
