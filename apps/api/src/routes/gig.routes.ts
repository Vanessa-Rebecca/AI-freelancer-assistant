import { Router } from 'express';
import { gigInputSchema, gigSaveSchema, gigUpdateSchema } from '@afa/shared';
import { requireAuth } from '../middleware/requireAuth.ts';
import { aiRateLimit } from '../middleware/aiRateLimit.ts';
import { validate } from '../middleware/validate.ts';
import * as gigController from '../controllers/gig.controller.ts';

export const gigRouter = Router();

gigRouter.use(requireAuth);

// Same order as proposals: rate limit, then validation, then credits
gigRouter.post('/generate', aiRateLimit, validate(gigInputSchema), gigController.generate);

gigRouter.get('/', gigController.list);
gigRouter.post('/', validate(gigSaveSchema), gigController.create);
gigRouter.get('/:id', gigController.get);
gigRouter.patch('/:id', validate(gigUpdateSchema), gigController.update);
gigRouter.delete('/:id', gigController.remove);
