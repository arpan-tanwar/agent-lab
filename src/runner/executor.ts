import { z } from 'zod';
import type { ExecutionContext, RunnerRepositories, ExecutionMetrics } from './types';
import { StepRegistry } from './registry';
import { callStructuredJson, type LlmClient } from './llm';

export interface RunWorkflowOptions {
  workflowId: string;
  input: unknown;
  runId?: string;
  budgets?: { maxMs?: number; maxTokens?: number };
}

export async function runWorkflow(
  repos: RunnerRepositories,
  registry: StepRegistry,
  llmClient: LlmClient,
  opts: RunWorkflowOptions,
): Promise<{ runId: string; metrics: ExecutionMetrics } | { error: string; runId?: string }> {
  const runId =
    opts.runId ||
    (await repos.createRunIfMissing?.({ workflowId: opts.workflowId })) ||
    crypto.randomUUID();
  const budgets = opts.budgets || {};
  const started = Date.now();
  const initialState: Record<string, unknown> =
    typeof opts.input === 'object' && opts.input !== null
      ? (opts.input as Record<string, unknown>)
      : { input: opts.input };
  const ctx: ExecutionContext = {
    runId,
    workflowId: opts.workflowId,
    budgets,
    now: () => Date.now(),
    countTokens: (text: string) => Math.ceil(text.length / 4),
    state: initialState,
  };

  const perStep: ExecutionMetrics['perStep'] = [];
  let totalTokens = 0;
  let costEstimateUsd = 0;
  await repos.updateRun({ runId, status: 'running' });

  try {
    const steps = await repos.loadWorkflowSteps(opts.workflowId);
    const ordered = steps.sort((a, b) => a.order - b.order);
    for (const s of ordered) {
      const stepStart = ctx.now();
      await repos.persistArtifact({ runId, stepId: s.id, kind: 'input', data: s.config });
      let tokens = 0;
      let cost = 0;
      let attempts: number | undefined;
      let errorTag: string | undefined;
      if (s.type === 'tool') {
        const tool = registry.getTool(String(s.config.name ?? ''));
        const parsedInput = (tool.inputSchema as z.ZodTypeAny).parse(ctx.state);
        const out = await tool.run(parsedInput, ctx);
        const parsedOut = (tool.outputSchema as z.ZodTypeAny).parse(out) as Record<string, unknown>;
        ctx.state = { ...(ctx.state as Record<string, unknown>), ...parsedOut };
        await repos.persistArtifact({ runId, stepId: s.id, kind: 'output', data: parsedOut });
      } else if (s.type === 'llm') {
        const llm = registry.getLlm(String(s.config.name ?? ''));
        const parsedInput = (llm.inputSchema as z.ZodTypeAny).parse(ctx.state);
        try {
          const res = await callStructuredJson(llm, parsedInput, ctx, llmClient, {
            maxRetries: 2,
            initialDelayMs: 200,
          });
          tokens = res.tokens;
          cost = res.costUsd;
          attempts = res.attempts;
          ctx.state = {
            ...(ctx.state as Record<string, unknown>),
            ...(res.value as Record<string, unknown>),
          };
          await repos.persistArtifact({ runId, stepId: s.id, kind: 'output', data: res.value });
        } catch (e: unknown) {
          const tag = (e as { tag?: string } | undefined)?.tag || 'LLM_FAILED';
          errorTag = tag;
          await repos.persistArtifact({
            runId,
            stepId: s.id,
            kind: 'log',
            data: { error: String(tag) },
          });
          throw e;
        }
      } else if (s.type === 'branch') {
        const br = registry.getBranch(String(s.config.name ?? ''));
        const parsedInput = (br.inputSchema as z.ZodTypeAny).parse(ctx.state);
        const next = await br.chooseNext(parsedInput, ctx);
        ctx.state.next = next;
        await repos.persistArtifact({ runId, stepId: s.id, kind: 'output', data: { next } });
      }
      const ms = ctx.now() - stepStart;
      totalTokens += tokens;
      costEstimateUsd += cost;
      const kind = s.type as 'tool' | 'llm' | 'branch';
      perStep.push({
        stepKey: String(s.id),
        kind,
        ms,
        tokens,
        costEstimateUsd: cost,
        attempts,
        errorTag,
      });

      // budgets
      if (opts.budgets?.maxMs && ctx.now() - started > opts.budgets.maxMs) {
        await repos.updateRun({
          runId,
          status: 'failed',
          metrics: { reason: 'BUDGET_MS_EXCEEDED' },
          finishedAt: new Date(),
        });
        return { error: 'BUDGET_MS_EXCEEDED', runId };
      }
      if (opts.budgets?.maxTokens && totalTokens > opts.budgets.maxTokens) {
        await repos.updateRun({
          runId,
          status: 'failed',
          metrics: { reason: 'BUDGET_TOKENS_EXCEEDED' },
          finishedAt: new Date(),
        });
        return { error: 'BUDGET_TOKENS_EXCEEDED', runId };
      }
    }

    const metrics: ExecutionMetrics = {
      totalMs: ctx.now() - started,
      totalTokens,
      costEstimateUsd,
      perStep,
    };
    await repos.updateRun({ runId, status: 'completed', metrics, finishedAt: new Date() });
    return { runId, metrics };
  } catch (e: unknown) {
    await repos.updateRun({
      runId,
      status: 'failed',
      metrics: { error: String(e) },
      finishedAt: new Date(),
    });
    return { error: 'EXECUTION_FAILED', runId };
  }
}
