import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.ts';
import * as dashboardController from '../controllers/dashboard.controller.ts';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);
dashboardRouter.get('/stats', dashboardController.stats);
dashboardRouter.get('/activity', dashboardController.activity);
