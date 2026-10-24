import { Router } from 'express';
import {
  coverLetterInputSchema,
  coverLetterSaveSchema,
  coverLetterUpdateSchema,
} from '@afa/shared';
import { requireAuth } from '../middleware/requireAuth.ts';
import { aiRateLimit } from '../middleware/aiRateLimit.ts';
import { validate } from '../middleware/validate.ts';
import * as coverLetterController from '../controllers/cover-letter.controller.ts';

export const coverLetterRouter = Router();

coverLetterRouter.use(requireAuth);

// Same order as proposals: rate limit, then validation, then credits
coverLetterRouter.post(
  '/generate',
  aiRateLimit,
  validate(coverLetterInputSchema),
  coverLetterController.generate,
);

coverLetterRouter.get('/', coverLetterController.list);
coverLetterRouter.post('/', validate(coverLetterSaveSchema), coverLetterController.create);
coverLetterRouter.get('/:id', coverLetterController.get);
coverLetterRouter.patch('/:id', validate(coverLetterUpdateSchema), coverLetterController.update);
coverLetterRouter.delete('/:id', coverLetterController.remove);
