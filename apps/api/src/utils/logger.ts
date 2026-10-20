// Minimal logger: one line per entry on stdout/stderr, which Render captures.
// Swap the internals for a structured logger here if we ever ship logs elsewhere.
function write(level: 'info' | 'warn' | 'error', message: string, meta?: unknown) {
  const line = `${new Date().toISOString()} ${level.toUpperCase()} ${message}`;
  const stream = level === 'error' ? process.stderr : process.stdout;
  stream.write(meta === undefined ? `${line}\n` : `${line} ${formatMeta(meta)}\n`);
}

function formatMeta(meta: unknown) {
  if (meta instanceof Error) return meta.stack ?? meta.message;
  return JSON.stringify(meta);
}

export const logger = {
  info: (message: string, meta?: unknown) => write('info', message, meta),
  warn: (message: string, meta?: unknown) => write('warn', message, meta),
  error: (message: string, meta?: unknown) => write('error', message, meta),
};
