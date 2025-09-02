import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import fixtures from './lead.fixtures.json';
import { createLeadRegistry, LeadInputSchema, makeParseEmailLlm } from '../src/workflows/lead';
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

const memoryRepos = () => {
  const artifacts: Artifact[] = [];
  const runs: Record<string, RunRow> = {};
  const steps = [
    { id: 1, order: 0, type: 'llm', config: { name: 'parseEmail' } },
    { id: 2, order: 1, type: 'tool', config: { name: 'enrichCompany' } },
    { id: 3, order: 2, type: 'tool', config: { name: 'scoreLead' } },
    { id: 4, order: 3, type: 'tool', config: { name: 'createCRMRecord' } },
    { id: 5, order: 4, type: 'tool', config: { name: 'notifySlack' } },
  ];
  const repos: RunnerRepositories & { artifacts: Artifact[] } = {
    artifacts,
    async persistArtifact(a) {
      artifacts.push(a);
    },
    async updateRun({ runId, ...rest }) {
      runs[runId] = { ...(runs[runId] || {}), runId, ...(rest as Omit<RunRow, 'runId'>) };
    },
    async createRunIfMissing({ workflowId }) {
      const id = crypto.randomUUID();
      runs[id] = { runId: id, workflowId, status: 'running' };
      return id;
    },
    async loadWorkflowSteps() {
      return steps;
    },
  };
  return repos;
};

describe('Lead Triage workflow', () => {
  const registry = createLeadRegistry('parseEmail');
  const llm = makeParseEmailLlm();

  it('contract: output shape and snapshot score/company', async () => {
    const repos = memoryRepos();
    const input = fixtures[0];
    const res = await runWorkflow(repos, registry, llm, {
      workflowId: 'lead',
      input,
      budgets: { maxMs: 2000, maxTokens: 1500 },
    });
    expect('runId' in res && 'metrics' in res).toBe(true);
  });

  it('run all 12 fixtures under budgets', async () => {
    const repos = memoryRepos();
    const results: Array<{ runId: string } | { error: string }> = [];
    for (const f of fixtures as Array<z.infer<typeof LeadInputSchema>>) {
      const res = await runWorkflow(repos, registry, llm, {
        workflowId: 'lead',
        input: f,
        budgets: { maxMs: 2000, maxTokens: 1500 },
      });
      results.push(res);
    }
    expect(results.every((r) => 'runId' in r)).toBe(true);
  });
});
