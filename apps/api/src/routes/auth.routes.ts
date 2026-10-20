import { Router } from 'express';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@afa/shared';
import { validate } from '../middleware/validate.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import * as authController from '../controllers/auth.controller.ts';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), authController.register);
authRouter.post('/login', validate(loginSchema), authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
authRouter.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
authRouter.get('/me', requireAuth, authController.me);
