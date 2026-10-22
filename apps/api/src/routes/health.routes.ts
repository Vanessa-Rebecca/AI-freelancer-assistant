import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ data: { status: 'ok', uptime: Math.round(process.uptime()) } });
});
