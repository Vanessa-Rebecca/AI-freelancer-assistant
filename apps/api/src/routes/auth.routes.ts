import { Router } from 'express';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@afa/shared';
import { validate } from '../middleware/validate.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import { ipAndEmail, rateLimit } from '../middleware/rateLimit.ts';
import * as authController from '../controllers/auth.controller.ts';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const limits = {
  // Brute force on one account
  loginPerAccount: rateLimit({
    windowMs: 15 * MINUTE,
    max: 5,
    key: ipAndEmail,
    failuresOnly: true,
  }),
  // One IP trying a few passwords across many accounts
  loginPerIp: rateLimit({ windowMs: 15 * MINUTE, max: 50 }),
  register: rateLimit({ windowMs: HOUR, max: 10 }),
  forgotPassword: rateLimit({ windowMs: HOUR, max: 5, key: ipAndEmail }),
  resetPassword: rateLimit({ windowMs: 15 * MINUTE, max: 10 }),
};

export const authRouter = Router();

// Limiters run before validation so malformed spam is counted too
authRouter.post('/register', limits.register, validate(registerSchema), authController.register);
authRouter.post(
  '/login',
  limits.loginPerIp,
  limits.loginPerAccount,
  validate(loginSchema),
  authController.login,
);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.post(
  '/forgot-password',
  limits.forgotPassword,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
authRouter.post(
  '/reset-password',
  limits.resetPassword,
  validate(resetPasswordSchema),
  authController.resetPassword,
);
authRouter.get('/me', requireAuth, authController.me);
