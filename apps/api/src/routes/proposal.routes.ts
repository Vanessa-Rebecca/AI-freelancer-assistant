import { Router } from 'express';
import { proposalInputSchema, proposalSaveSchema, proposalUpdateSchema } from '@afa/shared';
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

proposalRouter.get('/', proposalController.list);
proposalRouter.post('/', validate(proposalSaveSchema), proposalController.create);
proposalRouter.get('/:id', proposalController.get);
proposalRouter.patch('/:id', validate(proposalUpdateSchema), proposalController.update);
proposalRouter.delete('/:id', proposalController.remove);
