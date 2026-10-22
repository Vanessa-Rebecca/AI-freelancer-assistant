import type { AiFeature } from '@prisma/client';
import { getProvider } from '../ai/provider.ts';
import { AIProviderError } from '../ai/types.ts';
import type { AIProviderClient, AIRequest, AIResult } from '../ai/types.ts';
import { env } from '../config/env.ts';
import { prisma } from '../db/prisma.ts';
import { AppError } from '../utils/AppError.ts';
import { logger } from '../utils/logger.ts';

// Credits charged per successful generation
export const CREDIT_COST: Record<AiFeature, number> = {
  PROPOSAL: 1,
  COVER_LETTER: 1,
  GIG: 1,
  PRICING: 1,
  REPLY: 1,
  CONTRACT: 2,
};

const RETRY_DELAY_MS = 1000;

export type GenerationResult = AIResult & { creditsUsed: number; creditsRemaining: number };

/**
 * The single entry point for AI features:
 * take credits atomically -> call the AI (retry, then fallback, one shared deadline)
 * -> on failure refund -> always record the call in ai_usage.
 */
export async function generate(
  userId: string,
  feature: AiFeature,
  request: Omit<AIRequest, 'model' | 'signal'>,
): Promise<GenerationResult> {
  // A user's own API key (Step 5.6) will be read here and make the call free
  const provider = getProvider();
  const cost = CREDIT_COST[feature];

  await takeCredits(userId, cost);

  const started = Date.now();
  try {
    const result = await callWithFallback(provider, request);
    const { aiCredits } = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { aiCredits: true },
    });
    await recordUsage(userId, feature, provider, started, { result, creditsUsed: cost });
    return { ...result, creditsUsed: cost, creditsRemaining: aiCredits };
  } catch (err) {
    await refundCredits(userId, cost);
    await recordUsage(userId, feature, provider, started, { error: err });
    throw toClientError(err);
  }
}

// One atomic UPDATE: concurrent requests can't spend more than the balance
async function takeCredits(userId: string, cost: number) {
  const { count } = await prisma.user.updateMany({
    where: { id: userId, aiCredits: { gte: cost } },
    data: { aiCredits: { decrement: cost } },
  });
  if (count === 0) {
    throw new AppError(
      402,
      'INSUFFICIENT_CREDITS',
      `Not enough AI credits. This needs ${cost} credit${cost === 1 ? '' : 's'}.`,
    );
  }
}

async function refundCredits(userId: string, cost: number) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { aiCredits: { increment: cost } },
    });
  } catch (err) {
    // Leave a trail so a lost refund can be fixed by hand
    logger.error(`Credit refund of ${cost} failed for user ${userId}`, err);
  }
}

/**
 * Attempts, all sharing one deadline:
 *   primary model -> (if briefly busy) primary again after a pause -> each fallback model.
 * A retired model (404) or a used-up daily quota skips the same-model retry; each
 * fallback has its own quota. Auth/bad-request errors stop at once.
 */
async function callWithFallback(provider: AIProviderClient, request: AIRequest) {
  const deadline = AbortSignal.timeout(env.AI_TIMEOUT_MS);
  const fallbacks = (provider.name === 'GEMINI' ? env.GEMINI_FALLBACK_MODELS : []).filter(
    (m) => m !== provider.defaultModel,
  );
  const plan: { model: string; delay: number }[] = [
    { model: provider.defaultModel, delay: 0 },
    { model: provider.defaultModel, delay: RETRY_DELAY_MS },
    ...fallbacks.map((model) => ({ model, delay: 0 })),
  ];

  let lastError: unknown;
  for (let i = 0; i < plan.length; i++) {
    const { model, delay } = plan[i]!;
    // Only the second entry repeats the previous model
    const sameModel = i === 1;
    if (i > 0 && !shouldTryNext(lastError, sameModel)) {
      // Skip a pointless same-model retry but still give the fallback its turn
      if (sameModel) continue;
      break;
    }
    if (delay) await sleep(delay, deadline);
    try {
      return await provider.generate({ ...request, model, signal: deadline });
    } catch (err) {
      lastError = err;
      if (deadline.aborted) break;
      logger.warn(`AI attempt ${i + 1} failed on ${model}: ${(err as Error).message}`);
    }
  }
  throw deadline.aborted ? new DOMException('AI request timed out', 'TimeoutError') : lastError;
}

function shouldTryNext(err: unknown, sameModel: boolean) {
  if (!(err instanceof AIProviderError)) return false;
  const retired = err.status === 404;
  // Retrying a retired or out-of-quota model is pointless; another model may still work
  if (sameModel) return err.retryable && !retired && err.code !== 'QUOTA';
  return err.retryable || retired;
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

async function recordUsage(
  userId: string,
  feature: AiFeature,
  provider: AIProviderClient,
  started: number,
  outcome: { result: AIResult; creditsUsed: number } | { error: unknown },
) {
  const ok = 'result' in outcome;
  try {
    await prisma.aiUsage.create({
      data: {
        userId,
        feature,
        provider: provider.name,
        model: ok ? outcome.result.model : provider.defaultModel,
        inputTokens: ok ? outcome.result.inputTokens : 0,
        outputTokens: ok ? outcome.result.outputTokens : 0,
        creditsUsed: ok ? outcome.creditsUsed : 0,
        success: ok,
        errorCode: ok ? null : errorCode(outcome.error),
        durationMs: Date.now() - started,
      },
    });
  } catch (err) {
    logger.error('Failed to record AI usage', err);
  }
}

function errorCode(err: unknown) {
  if (err instanceof AIProviderError) return err.code;
  if (err instanceof DOMException && err.name === 'TimeoutError') return 'TIMEOUT';
  return 'UNKNOWN';
}

// Turn provider failures into messages that are safe and useful for users
function toClientError(err: unknown) {
  if (err instanceof AppError) return err;
  const refunded = 'Your credit was refunded.';

  if (err instanceof DOMException && err.name === 'TimeoutError') {
    return new AppError(504, 'AI_TIMEOUT', `The AI took too long to respond. ${refunded}`);
  }
  if (err instanceof AIProviderError) {
    // Every model in the chain has used up its daily allowance
    if (err.code === 'QUOTA') {
      return new AppError(
        503,
        'AI_QUOTA',
        `Today's free AI limit has been reached. Please try again later. ${refunded}`,
      );
    }
    if (err.retryable) {
      return new AppError(
        503,
        'AI_UNAVAILABLE',
        `The AI service is busy right now. Please try again in a moment. ${refunded}`,
      );
    }
    // Key or request problems are ours to fix; details stay in the server log
    logger.error('AI provider rejected the request', err);
    return new AppError(502, 'AI_ERROR', `AI service configuration error. ${refunded}`);
  }
  logger.error('Unexpected AI failure', err);
  return new AppError(500, 'INTERNAL_ERROR', `Something went wrong. ${refunded}`);
}
