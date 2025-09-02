import { z, ZodTypeAny } from 'zod';

export type StepKind = 'tool' | 'llm' | 'branch';

export interface ToolDefinition<
  I extends ZodTypeAny = ZodTypeAny,
  O extends ZodTypeAny = ZodTypeAny,
> {
  kind: 'tool';
  name: string;
  inputSchema: I;
  outputSchema: O;
  run: (input: z.infer<I>, ctx: ExecutionContext) => Promise<z.infer<O>> | z.infer<O>;
}

export interface LlmDefinition<
  I extends ZodTypeAny = ZodTypeAny,
  O extends ZodTypeAny = ZodTypeAny,
> {
  kind: 'llm';
  name: string;
  inputSchema: I; // used for templating context
  outputSchema: O; // strict JSON output expected
  prompt: (input: z.infer<I>, ctx: ExecutionContext) => string;
}

export interface BranchDefinition<I extends ZodTypeAny = ZodTypeAny> {
  kind: 'branch';
  name: string;
  inputSchema: I;
  chooseNext: (
    input: z.infer<I>,
    ctx: ExecutionContext,
  ) => Promise<string | number> | string | number; // returns next step key (order or label)
}

export type AnyStepDefinition = ToolDefinition | LlmDefinition | BranchDefinition;

export interface ExecutionMetrics {
  totalMs: number;
  totalTokens: number;
  costEstimateUsd: number;
  perStep: Array<{
    stepKey: string;
    kind: StepKind;
    ms: number;
    tokens: number;
    costEstimateUsd: number;
    attempts?: number;
    errorTag?: string;
  }>;
}

export interface BudgetGuards {
  maxMs?: number;
  maxTokens?: number;
}

export interface ExecutionContext {
  runId: string;
  workflowId: string;
  budgets: BudgetGuards;
  now: () => number;
  countTokens: (text: string) => number;
  // ad-hoc bag for passing data across steps
  state: Record<string, unknown>;
}

export interface RunnerRepositories {
  persistArtifact: (args: {
    runId: string;
    stepId: number | string;
    kind: 'input' | 'output' | 'log';
    data: unknown;
  }) => Promise<void>;
  updateRun: (args: {
    runId: string;
    status: 'running' | 'completed' | 'failed';
    metrics?: unknown;
    finishedAt?: Date;
  }) => Promise<void>;
  createRunIfMissing?: (args: { workflowId: string }) => Promise<string>; // returns runId
  loadWorkflowSteps: (
    workflowId: string,
  ) => Promise<
    Array<{ id: number | string; order: number; type: string; config: Record<string, unknown> }>
  >;
}
