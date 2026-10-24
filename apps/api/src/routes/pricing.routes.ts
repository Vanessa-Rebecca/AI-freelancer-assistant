import { Router } from 'express';
import { pricingInputSchema, pricingSaveSchema } from '@afa/shared';
import { requireAuth } from '../middleware/requireAuth.ts';
import { validate } from '../middleware/validate.ts';
import * as pricingController from '../controllers/pricing.controller.ts';

export const pricingRouter = Router();

pricingRouter.use(requireAuth);

// Deterministic maths: no AI, no credits
pricingRouter.post('/calculate', validate(pricingInputSchema), pricingController.calculate);

pricingRouter.get('/history', pricingController.history);
pricingRouter.post('/', validate(pricingSaveSchema), pricingController.create);
pricingRouter.get('/:id', pricingController.get);
pricingRouter.delete('/:id', pricingController.remove);
