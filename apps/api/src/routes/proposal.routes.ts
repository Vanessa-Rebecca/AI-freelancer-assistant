import { Router } from 'express';
import { proposalInputSchema } from '@afa/shared';
import { requireAuth } from '../middleware/requireAuth.ts';
import { aiRateLimit } from '../middleware/aiRateLimit.ts';
import { validate } from '../middleware/validate.ts';
import * as proposalController from '../controllers/proposal.controller.ts';

export const proposalRouter = Router();

proposalRouter.use(requireAuth);

// Rate limit before validation (junk requests still count); validation before
// credits (a typo never costs a credit or reaches the AI)
proposalRouter.post(
  '/generate',
  aiRateLimit,
  validate(proposalInputSchema),
  proposalController.generate,
);
