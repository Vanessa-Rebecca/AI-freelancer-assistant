import { Router } from 'express';
import { registerSchema } from '@afa/shared';
import { validate } from '../middleware/validate.ts';
import * as authController from '../controllers/auth.controller.ts';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), authController.register);
