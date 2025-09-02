import { describe, it, expect } from 'vitest';
import fixtures from './ticket.fixtures.json';
import { createTicketRegistry, makeTicketLlm } from '../src/workflows/ticket';
import { runWorkflow } from '../src/runner/executor';
import type { RunnerRepositories } from '../src/runner/types';

type RunRow = {
  runId: string;
  workflowId?: string;
  status: string;
  metrics?: unknown;
  finishedAt?: Date;
};

const memoryRepos = () => {
  const runs: Record<string, RunRow> = {};
  const steps = [
    { id: 1, order: 0, type: 'llm', config: { name: 'classifyTicket' } },
    { id: 2, order: 1, type: 'llm', config: { name: 'summarizeTicket' } },
    { id: 3, order: 2, type: 'tool', config: { name: 'nextAction' } },
    { id: 4, order: 3, type: 'tool', config: { name: 'saveDraft' } },
  ];
  const repos: RunnerRepositories = {
    async persistArtifact() {},
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

describe('Ticket Summarizer workflow', () => {
  const registry = createTicketRegistry();
  const llm = makeTicketLlm();

  it('contracts: executes under budget and returns expected keys', async () => {
    const repos = memoryRepos();
    const res = await runWorkflow(repos, registry, llm, {
      workflowId: 'ticket',
      input: fixtures[0],
      budgets: { maxMs: 2000, maxTokens: 1500 },
    });
    expect('runId' in res).toBe(true);
  });

  it('run 12 fixtures under budgets', async () => {
    const repos = memoryRepos();
    const results: Array<{ runId: string } | { error: string }> = [];
    for (const f of fixtures) {
      results.push(
        await runWorkflow(repos, registry, llm, {
          workflowId: 'ticket',
          input: f,
          budgets: { maxMs: 2000, maxTokens: 1500 },
        }),
      );
    }
    expect(results.every((r) => 'runId' in r)).toBe(true);
  });
});
