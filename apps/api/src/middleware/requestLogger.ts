import type { RequestHandler } from 'express';
import { logger } from '../utils/logger.ts';

// Logs "METHOD /path STATUS 12ms" once the response has been sent
export const requestLogger: RequestHandler = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1_000_000;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(0)}ms`;
    if (res.statusCode >= 500) logger.error(message);
    else if (res.statusCode >= 400) logger.warn(message);
    else logger.info(message);
  });

  next();
};
