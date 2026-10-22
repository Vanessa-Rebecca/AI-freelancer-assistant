import { z } from 'zod';

// Every environment variable the API reads is declared here.
// Add new ones in the step that first needs them, and mirror them in .env.example.
// An empty value (KEY= copied from .env.example) counts as "not set"
const optionalSecret = z
  .string()
  .optional()
  .transform((v) => v?.trim() || undefined);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.url().default('http://localhost:5173'),
  // Number of proxies in front of the API (Render, Vercel), so req.ip is the real client
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  DATABASE_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(32, 'must be at least 32 characters'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900), // 15 min
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

  // AI. Keys are optional so the app still runs without them; AI calls then fail clearly.
  GEMINI_API_KEY: optionalSecret,
  GEMINI_MODEL: z.string().default('gemini-3.5-flash'),
  GEMINI_FALLBACK_MODEL: z.string().default('gemini-3.6-flash'),
  // 0 = no "thinking": faster, and replies aren't cut off. Unset to use the model default.
  GEMINI_THINKING_BUDGET: z.coerce.number().int().min(0).optional().default(0),
  OPENAI_API_KEY: optionalSecret,
  OPENAI_MODEL: z.string().default('gpt-5-mini'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
