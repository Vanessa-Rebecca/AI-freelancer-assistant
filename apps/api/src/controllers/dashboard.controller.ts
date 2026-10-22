import type { RequestHandler } from 'express';
import { activityQuerySchema } from '@afa/shared';
import { authUser } from '../middleware/requireAuth.ts';
import * as dashboardService from '../services/dashboard.service.ts';

export const stats: RequestHandler = async (req, res) => {
  const stats = await dashboardService.getStats(authUser(req).id);
  res.json({ data: { stats } });
};

export const activity: RequestHandler = async (req, res) => {
  // req.query is read-only in Express 5, so it's parsed here rather than by validate()
  const { limit } = activityQuerySchema.parse(req.query);
  const items = await dashboardService.getRecentActivity(authUser(req).id, limit);
  res.json({ data: { items } });
};
