import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.ts';
import { requestLogger } from './middleware/requestLogger.ts';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.ts';
import { healthRouter } from './routes/health.routes.ts';
import { authRouter } from './routes/auth.routes.ts';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(requestLogger);
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', authRouter);

  // Must stay last: unknown routes, then the single error formatter
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
