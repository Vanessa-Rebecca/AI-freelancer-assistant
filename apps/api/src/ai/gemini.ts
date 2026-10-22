import { AIProviderError, postJson } from './types.ts';
import type { AIProviderClient, AIRequest, AIResult } from './types.ts';

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; details?: { reason?: string }[] };
};

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Google Gemini via its REST API (no SDK). Thinking is off by default: it made
// replies slower and cut them off at the token limit in our tests.
export class GeminiProvider implements AIProviderClient {
  readonly name = 'GEMINI' as const;
  readonly defaultModel: string;
  readonly #apiKey: string;
  readonly #thinkingBudget: number | undefined;

  constructor(apiKey: string, model: string, thinkingBudget?: number) {
    this.#apiKey = apiKey;
    this.defaultModel = model;
    this.#thinkingBudget = thinkingBudget;
  }

  async generate(req: AIRequest): Promise<AIResult> {
    const model = req.model ?? this.defaultModel;
    const res = await postJson(
      `${BASE_URL}/${encodeURIComponent(model)}:generateContent`,
      // Key in a header, not the URL, so it never ends up in logs
      { 'x-goog-api-key': this.#apiKey },
      {
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: 'user', parts: [{ text: req.prompt }] }],
        generationConfig: {
          maxOutputTokens: req.maxOutputTokens ?? 2048,
          temperature: req.temperature ?? 0.7,
          ...(req.json && { responseMimeType: 'application/json' }),
          ...(this.#thinkingBudget !== undefined && {
            thinkingConfig: { thinkingBudget: this.#thinkingBudget },
          }),
        },
      },
      req.signal,
    );

    const body = (await res.json().catch(() => ({}))) as GeminiResponse;
    if (!res.ok) {
      // Gemini reports a bad key as 400, not 401; treat it as an auth error
      if (body.error?.details?.some((d) => d.reason === 'API_KEY_INVALID')) {
        throw new AIProviderError('AUTH', 'The Gemini API key is invalid', res.status);
      }
      throw AIProviderError.fromStatus(
        res.status,
        body.error?.message ?? `Gemini error ${res.status}`,
      );
    }

    const candidate = body.candidates?.[0];
    const text = candidate?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    if (!text) {
      const reason = body.promptFeedback?.blockReason ?? candidate?.finishReason ?? 'no content';
      throw new AIProviderError('EMPTY', `Gemini returned no text (${reason})`);
    }

    return {
      text,
      model,
      inputTokens: body.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: body.usageMetadata?.candidatesTokenCount ?? 0,
      finishReason: candidate?.finishReason ?? 'STOP',
    };
  }
}
