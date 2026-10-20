import { PrismaClient } from '@prisma/client';
import { isProduction } from '../config/env.ts';

// A single shared client: each instance opens its own connection pool
export const prisma = new PrismaClient({
  log: isProduction ? ['error'] : ['warn', 'error'],
});
