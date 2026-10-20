import { createApp } from './app.ts';

// Replaced by validated env config in Step 1.2
const PORT = Number(process.env.PORT ?? 4000);

const server = createApp().listen(PORT, () => {
  console.warn(`API listening on http://localhost:${PORT}`);
});

// Render sends SIGTERM on redeploy: finish in-flight requests, then exit
function shutdown(signal: string) {
  console.warn(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
