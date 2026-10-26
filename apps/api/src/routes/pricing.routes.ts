import { Router } from 'express';
import { pricingInputSchema, pricingProjectSchema, pricingSaveSchema } from '@afa/shared';
import { aiRateLimit } from '../middleware/aiRateLimit.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import { validate } from '../middleware/validate.ts';
import * as pricingController from '../controllers/pricing.controller.ts';

export const pricingRouter = Router();

pricingRouter.use(requireAuth);

// Deterministic maths: no AI, no credits
pricingRouter.post('/calculate', validate(pricingInputSchema), pricingController.calculate);

// Same order as the other AI routes: rate limit, then validation, then credits
pricingRouter.post(
  '/suggest',
  aiRateLimit,
  validate(pricingProjectSchema),
  pricingController.suggest,
);

pricingRouter.get('/history', pricingController.history);
pricingRouter.post('/', validate(pricingSaveSchema), pricingController.create);
pricingRouter.get('/:id', pricingController.get);
pricingRouter.delete('/:id', pricingController.remove);
