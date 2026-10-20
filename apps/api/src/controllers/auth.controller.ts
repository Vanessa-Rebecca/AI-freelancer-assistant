import type { RequestHandler } from 'express';
import * as authService from '../services/auth.service.ts';

export const register: RequestHandler = async (req, res) => {
  const user = await authService.registerUser(req.body);
  res.status(201).json({ data: { user } });
};
