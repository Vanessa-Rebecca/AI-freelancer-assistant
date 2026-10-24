import type { AiProvider } from '@prisma/client';
import { env } from '../config/env.ts';
import { AppError } from '../utils/AppError.ts';
import { GeminiProvider } from './gemini.ts';
import { OpenAIProvider } from './openai.ts';
import type { AIProviderClient } from './types.ts';

type ProviderChoice = {
  provider?: AiProvider;
  // A user's own key from Settings; falls back to the app's key from .env
  apiKey?: string | null;
};

export function getProvider({
  provider = 'GEMINI',
  apiKey,
}: ProviderChoice = {}): AIProviderClient {
  if (provider === 'OPENAI') {
    const key = apiKey ?? env.OPENAI_API_KEY;
    if (!key) throw notConfigured('OpenAI');
    return new OpenAIProvider(key, env.OPENAI_MODEL);
  }

  const key = apiKey ?? env.GEMINI_API_KEY;
  if (!key) throw notConfigured('Gemini');
  return new GeminiProvider(key, env.GEMINI_MODEL, env.GEMINI_THINKING_BUDGET);
}

function notConfigured(name: string) {
  return new AppError(
    503,
    'AI_NOT_CONFIGURED',
    `AI generation is not set up (${name} key missing).`,
  );
}
