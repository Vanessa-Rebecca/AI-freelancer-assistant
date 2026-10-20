import { createApp } from './app.ts';
import { env } from './config/env.ts';

const server = createApp().listen(env.PORT, () => {
  console.warn(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

// Render sends SIGTERM on redeploy: finish in-flight requests, then exit
function shutdown(signal: string) {
  console.warn(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
