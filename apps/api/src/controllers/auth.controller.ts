import type { RequestHandler } from 'express';
import * as authService from '../services/auth.service.ts';
import { authUser } from '../middleware/requireAuth.ts';
import { setRefreshCookie } from '../utils/tokens.ts';

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

export const me: RequestHandler = async (req, res) => {
  const user = await authService.getCurrentUser(authUser(req).id);
  res.json({ data: { user } });
};
