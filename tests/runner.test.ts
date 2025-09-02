import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { createDefaultRegistry } from '../src/runner/defaults';
import { runWorkflow } from '../src/runner/executor';
import type { RunnerRepositories } from '../src/runner/types';

type Artifact = {
  runId: string;
  stepId: number | string;
  kind: 'input' | 'output' | 'log';
  data: unknown;
};
type RunRow = {
  runId: string;
  workflowId?: string;
  status: string;
  metrics?: unknown;
  finishedAt?: Date;
};
const memoryRepos = (): RunnerRepositories & {
  stepsStore: Array<{ id: number; order: number; type: string; config: Record<string, unknown> }>;
  artifacts: Artifact[];
  runs: Record<string, RunRow>;
} => {
  const artifacts: Artifact[] = [];
  const runs: Record<string, RunRow> = {};
  const stepsStore: Array<{
    id: number;
    order: number;
    type: string;
    config: Record<string, unknown>;
  }> = [];
  return {
    stepsStore,
    artifacts,
    runs,
    async persistArtifact(a: Artifact) {
      artifacts.push(a);
    },
    async updateRun({
      runId,
      ...rest
    }: {
      runId: string;
      status: RunRow['status'];
      metrics?: unknown;
      finishedAt?: Date;
    }) {
      runs[runId] = { ...(runs[runId] || {}), runId, ...(rest as Omit<RunRow, 'runId'>) };
    },
    async createRunIfMissing({ workflowId }: { workflowId: string }) {
      const id = crypto.randomUUID();
      runs[id] = { runId: id, workflowId, status: 'running' };
      return id;
    },
    async loadWorkflowSteps() {
      return stepsStore;
    },
  };
};

const dummyLlm = {
  async complete(prompt: string) {
    return {
      text: JSON.stringify({ out: `ok:${prompt.length}` }),
      tokens: Math.ceil(prompt.length / 4),
      costUsd: 0.001,
    };
  },
};

describe('runWorkflow', () => {
  it('executes tool and llm with budgets and artifacts', async () => {
    const repos = memoryRepos();
    const registry = createDefaultRegistry();
    // add an llm def that produces strict JSON
    registry.register({
      kind: 'llm',
      name: 'classify',
      inputSchema: z.object({ message: z.string() }),
      outputSchema: z.object({ out: z.string() }),
      prompt: (input) => `Say JSON for: ${(input as { message: string }).message}`,
    });

    // workflow: echo tool -> llm classify
    repos.stepsStore.push(
      { id: 1, order: 0, type: 'tool', config: { name: 'echo' } },
      { id: 2, order: 1, type: 'llm', config: { name: 'classify' } },
    );

    const res = await runWorkflow(repos, registry, dummyLlm, {
      workflowId: 'wf1',
      input: { message: 'hello' },
      budgets: { maxMs: 5000, maxTokens: 5000 },
    });

    expect('runId' in res).toBe(true);
    if ('runId' in res && 'metrics' in res) {
      expect(res.metrics.perStep.length).toBe(2);
      expect(res.metrics.totalTokens).toBeGreaterThan(0);
    } else {
      throw new Error('runner returned error');
    }
  });
});
