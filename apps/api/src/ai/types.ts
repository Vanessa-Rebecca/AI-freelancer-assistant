import type { AiProvider } from '@prisma/client';

export type AIRequest = {
  system: string;
  prompt: string;
  // Ask the model for a JSON object instead of prose
  json?: boolean;
  maxOutputTokens?: number;
  temperature?: number;
  // Overrides the provider's default model (used for fallback)
  model?: string;
  signal?: AbortSignal;
};

export type AIResult = {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  // 'STOP' when the model finished normally; 'MAX_TOKENS' when cut off
  finishReason: string;
};

export interface AIProviderClient {
  readonly name: AiProvider;
  readonly defaultModel: string;
  generate(request: AIRequest): Promise<AIResult>;
}

// Thrown by providers. `retryable` tells the caller whether trying again
// (or with the fallback model) could succeed.
export class AIProviderError extends Error {
  readonly code: 'RATE_LIMITED' | 'UNAVAILABLE' | 'AUTH' | 'BAD_REQUEST' | 'EMPTY' | 'NETWORK';
  readonly retryable: boolean;
  readonly status?: number;

  constructor(code: AIProviderError['code'], message: string, status?: number) {
    super(message);
    this.name = 'AIProviderError';
    this.code = code;
    this.status = status;
    this.retryable = code === 'RATE_LIMITED' || code === 'UNAVAILABLE' || code === 'NETWORK';
  }

  static fromStatus(status: number, message: string) {
    if (status === 429) return new AIProviderError('RATE_LIMITED', message, status);
    if (status >= 500) return new AIProviderError('UNAVAILABLE', message, status);
    if (status === 401 || status === 403) return new AIProviderError('AUTH', message, status);
    return new AIProviderError('BAD_REQUEST', message, status);
  }
}

// Wraps fetch so network failures become retryable provider errors
export async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  signal?: AbortSignal,
) {
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new AIProviderError(
      'NETWORK',
      `Could not reach the AI provider: ${(err as Error).message}`,
    );
  }
}
