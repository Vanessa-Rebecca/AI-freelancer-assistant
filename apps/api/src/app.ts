import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { healthRouter } from './routes/health.routes.ts';

// Replaced by validated env config in Step 1.2
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/v1/health', healthRouter);

  return app;
}
