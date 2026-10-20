import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

// Replaces req.body with the parsed result: trimmed, lowercased, unknown fields
// stripped. A ZodError is formatted as a 400 by the error handler.
export function validate(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body ?? {});
    next();
  };
}
