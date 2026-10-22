import type { RequestHandler } from 'express';
import * as authService from '../services/auth.service.ts';
import * as passwordResetService from '../services/password-reset.service.ts';
import { authUser } from '../middleware/requireAuth.ts';
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from '../utils/tokens.ts';

export const register: RequestHandler = async (req, res) => {
  const { user, accessToken, refreshToken, refreshExpiresAt } = await authService.registerUser(
    req.body,
    req.headers['user-agent'],
  );
  setRefreshCookie(res, refreshToken, refreshExpiresAt);
  res.status(201).json({ data: { user, accessToken } });
};

export const login: RequestHandler = async (req, res) => {
  const { user, accessToken, refreshToken, refreshExpiresAt } = await authService.loginUser(
    req.body,
    req.headers['user-agent'],
  );
  setRefreshCookie(res, refreshToken, refreshExpiresAt);
  res.json({ data: { user, accessToken } });
};

export const refresh: RequestHandler = async (req, res) => {
  try {
    const { user, accessToken, refreshToken, refreshExpiresAt } = await authService.refreshSession(
      readRefreshCookie(req),
      req.headers['user-agent'],
    );
    setRefreshCookie(res, refreshToken, refreshExpiresAt);
    res.json({ data: { user, accessToken } });
  } catch (err) {
    // Don't let the browser keep sending a dead cookie
    clearRefreshCookie(res);
    throw err;
  }
};

export const logout: RequestHandler = async (req, res) => {
  await authService.logoutSession(readRefreshCookie(req));
  clearRefreshCookie(res);
  res.status(204).end();
};

export const forgotPassword: RequestHandler = (req, res) => {
  passwordResetService.requestPasswordReset(req.body);
  res.json({
    data: { message: "If an account exists for that email, we've sent a reset link." },
  });
};

export const resetPassword: RequestHandler = async (req, res) => {
  await passwordResetService.resetPassword(req.body);
  res.json({ data: { message: 'Password updated. Please log in with your new password.' } });
};

export const me: RequestHandler = async (req, res) => {
  const user = await authService.getCurrentUser(authUser(req).id);
  res.json({ data: { user } });
};
