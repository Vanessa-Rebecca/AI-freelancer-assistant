import { AIProviderError, postJson } from './types.ts';
import type { AIProviderClient, AIRequest, AIResult } from './types.ts';

type ChatResponse = {
  model?: string;
  choices?: { message?: { content?: string | null }; finish_reason?: string }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
};

// OpenAI Chat Completions via REST (no SDK). Written against the documented
// API; not yet exercised with a real key in this project.
export class OpenAIProvider implements AIProviderClient {
  readonly name = 'OPENAI' as const;
  readonly defaultModel: string;
  readonly #apiKey: string;

  constructor(apiKey: string, model: string) {
    this.#apiKey = apiKey;
    this.defaultModel = model;
  }

  async generate(req: AIRequest): Promise<AIResult> {
    const model = req.model ?? this.defaultModel;
    const res = await postJson(
      'https://api.openai.com/v1/chat/completions',
      { Authorization: `Bearer ${this.#apiKey}` },
      {
        model,
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: req.prompt },
        ],
        max_completion_tokens: req.maxOutputTokens ?? 2048,
        ...(req.json && { response_format: { type: 'json_object' } }),
      },
      req.signal,
    );

    const body = (await res.json().catch(() => ({}))) as ChatResponse;
    if (!res.ok) {
      throw AIProviderError.fromStatus(
        res.status,
        body.error?.message ?? `OpenAI error ${res.status}`,
      );
    }

    const choice = body.choices?.[0];
    const text = choice?.message?.content ?? '';
    if (!text)
      throw new AIProviderError('EMPTY', `OpenAI returned no text (${choice?.finish_reason})`);

    return {
      text,
      model: body.model ?? model,
      inputTokens: body.usage?.prompt_tokens ?? 0,
      outputTokens: body.usage?.completion_tokens ?? 0,
      // Normalise to the same vocabulary as Gemini
      finishReason: choice?.finish_reason === 'length' ? 'MAX_TOKENS' : 'STOP',
    };
  }
}
