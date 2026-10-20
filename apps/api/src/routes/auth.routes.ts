import { Router } from 'express';
import { loginSchema, registerSchema } from '@afa/shared';
import { validate } from '../middleware/validate.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import * as authController from '../controllers/auth.controller.ts';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), authController.register);
authRouter.post('/login', validate(loginSchema), authController.login);
authRouter.get('/me', requireAuth, authController.me);
