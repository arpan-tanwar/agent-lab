import { z, ZodTypeAny } from 'zod';
import type { LlmDefinition, ExecutionContext } from './types';

export interface LlmClientResponse {
  text: string;
  tokens: number;
  costUsd: number;
}

export interface LlmClient {
  complete: (prompt: string) => Promise<LlmClientResponse>;
}

export async function callStructuredJson<I extends ZodTypeAny, O extends ZodTypeAny>(
  def: LlmDefinition<I, O>,
  input: z.infer<I>,
  ctx: ExecutionContext,
  client: LlmClient,
  opts?: { maxRetries?: number; initialDelayMs?: number },
): Promise<{
  value: z.infer<O>;
  tokens: number;
  costUsd: number;
  attempts: number;
  errorTag?: string;
}> {
  const maxRetries = opts?.maxRetries ?? 2;
  const initialDelayMs = opts?.initialDelayMs ?? 250;
  let attempt = 0;
  let lastError: unknown;
  while (attempt <= maxRetries) {
    const prompt = def.prompt(input, ctx);
    const res = await client.complete(prompt);
    try {
      const parsed = def.outputSchema.parse(JSON.parse(res.text));
      return { value: parsed, tokens: res.tokens, costUsd: res.costUsd, attempts: attempt + 1 };
    } catch (err) {
      lastError = err;
      attempt += 1;
      if (attempt > maxRetries) break;
      const backoff = initialDelayMs * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  return Promise.reject({ tag: 'SCHEMA_PARSE_FAILED', cause: lastError });
}
