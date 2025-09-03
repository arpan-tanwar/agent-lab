import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export interface StepMetrics {
  stepId: number;
  stepName: string;
  stepType: 'llm' | 'tool';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  finishedAt?: Date;
  duration?: number;
  tokens?: number;
  costUsd?: number;
  retryCount: number;
  error?: any;
}

export interface RunMetrics {
  runId: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  finishedAt?: Date;
  totalDuration?: number;
  totalTokens: number;
  totalCostUsd: number;
  steps: StepMetrics[];
  failureReason?: string;
  retryCount: number;
}

export class MetricsCollector {
  private requestId: string;
  private runId: string;
  private workflowId: string;
  private stepMetrics: Map<number, StepMetrics> = new Map();
  private startTime: number;

  constructor(requestId: string, runId: string, workflowId: string) {
    this.requestId = requestId;
    this.runId = runId;
    this.workflowId = workflowId;
    this.startTime = Date.now();
  }

  startStep(stepId: number, stepName: string, stepType: 'llm' | 'tool') {
    const stepMetric: StepMetrics = {
      stepId,
      stepName,
      stepType,
      status: 'running',
      startedAt: new Date(),
      retryCount: 0,
    };

    this.stepMetrics.set(stepId, stepMetric);

    logger.info(
      {
        requestId: this.requestId,
        runId: this.runId,
        workflowId: this.workflowId,
        stepId,
        stepName,
        stepType,
        action: 'step_started',
      },
      'Step started',
    );
  }

  completeStep(stepId: number, tokens?: number, costUsd?: number) {
    const stepMetric = this.stepMetrics.get(stepId);
    if (!stepMetric) return;

    const finishedAt = new Date();
    const duration = finishedAt.getTime() - (stepMetric.startedAt?.getTime() || 0);

    stepMetric.status = 'completed';
    stepMetric.finishedAt = finishedAt;
    stepMetric.duration = duration;
    stepMetric.tokens = tokens || 0;
    stepMetric.costUsd = costUsd || 0;

    logger.info(
      {
        requestId: this.requestId,
        runId: this.runId,
        workflowId: this.workflowId,
        stepId,
        stepName: stepMetric.stepName,
        stepType: stepMetric.stepType,
        duration,
        tokens: stepMetric.tokens,
        costUsd: stepMetric.costUsd,
        retryCount: stepMetric.retryCount,
        action: 'step_completed',
      },
      'Step completed',
    );
  }

  failStep(stepId: number, error: any, retryCount: number = 0) {
    const stepMetric = this.stepMetrics.get(stepId);
    if (!stepMetric) return;

    const finishedAt = new Date();
    const duration = finishedAt.getTime() - (stepMetric.startedAt?.getTime() || 0);

    stepMetric.status = 'failed';
    stepMetric.finishedAt = finishedAt;
    stepMetric.duration = duration;
    stepMetric.error = error;
    stepMetric.retryCount = retryCount;

    logger.error(
      {
        requestId: this.requestId,
        runId: this.runId,
        workflowId: this.workflowId,
        stepId,
        stepName: stepMetric.stepName,
        stepType: stepMetric.stepType,
        duration,
        retryCount,
        error: error instanceof Error ? error.message : String(error),
        action: 'step_failed',
      },
      'Step failed',
    );
  }

  getRunMetrics(status: 'completed' | 'failed', failureReason?: string): RunMetrics {
    const finishedAt = new Date();
    const totalDuration = finishedAt.getTime() - this.startTime;

    const steps = Array.from(this.stepMetrics.values());
    const totalTokens = steps.reduce((sum, step) => sum + (step.tokens || 0), 0);
    const totalCostUsd = steps.reduce((sum, step) => sum + (step.costUsd || 0), 0);

    const runMetrics: RunMetrics = {
      runId: this.runId,
      workflowId: this.workflowId,
      status,
      startedAt: new Date(this.startTime),
      finishedAt,
      totalDuration,
      totalTokens,
      totalCostUsd,
      steps,
      failureReason,
      retryCount: Math.max(...steps.map((s) => s.retryCount), 0),
    };

    logger.info(
      {
        requestId: this.requestId,
        runId: this.runId,
        workflowId: this.workflowId,
        status,
        totalDuration,
        totalTokens,
        totalCostUsd,
        stepCount: steps.length,
        failureReason,
        action: 'run_completed',
      },
      'Run completed',
    );

    return runMetrics;
  }

  getStepMetrics(stepId: number): StepMetrics | undefined {
    return this.stepMetrics.get(stepId);
  }
}

export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;

  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}
