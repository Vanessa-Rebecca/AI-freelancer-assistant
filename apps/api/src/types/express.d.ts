import type { Role } from '@prisma/client';

// Adds req.user, set by the requireAuth middleware
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}

export {};
