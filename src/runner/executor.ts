import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import {
  workflows,
  steps as stepsTable,
  runs as runsTable,
  artifacts as artifactsTable,
} from '../db/schema.js';
import { geminiProvider, type LLMConfig } from './llm.js';
import { toolRegistry, type ToolConfig } from './tools.js';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export interface Step {
  id: number;
  workflowId: string;
  type: string;
  order: number;
  config: Record<string, any>;
}

export interface RunContext {
  runId: string;
  workflowId: string;
  input?: any;
  stepResults: Map<number, any>;
}

export class WorkflowExecutor {
  async executeRun(runId: string): Promise<void> {
    const startTime = Date.now();

    try {
      logger.info({ runId }, 'Starting workflow execution');

      // Get the run details
      const run = (await db.select().from(runsTable).where(eq(runsTable.id, runId)).limit(1))[0];
      if (!run) {
        throw new Error(`Run ${runId} not found`);
      }

      // Get workflow steps
      const steps = await db
        .select()
        .from(stepsTable)
        .where(eq(stepsTable.workflowId, run.workflowId))
        .orderBy(stepsTable.order);

      if (steps.length === 0) {
        logger.warn({ runId, workflowId: run.workflowId }, 'No steps found for workflow');
        await this.completeRun(runId, {});
        return;
      }

      // Create execution context
      const context: RunContext = {
        runId,
        workflowId: run.workflowId,
        input: run.input,
        stepResults: new Map(),
      };

      // Execute steps in order
      for (const step of steps) {
        try {
          await this.executeStep(step as Step, context);
        } catch (error) {
          logger.error(
            {
              runId,
              stepId: step.id,
              stepType: step.type,
              error: error instanceof Error ? error.message : String(error),
            },
            'Step execution failed',
          );

          await this.failRun(
            runId,
            `Step ${step.id} failed: ${error instanceof Error ? error.message : String(error)}`,
          );
          return;
        }
      }

      // Calculate final metrics
      const totalDuration = Date.now() - startTime;
      const metrics = await this.calculateRunMetrics(runId);

      await this.completeRun(runId, {
        ...metrics,
        totalMs: totalDuration,
      });

      logger.info({ runId, totalDuration }, 'Workflow execution completed');
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(
        {
          runId,
          error: error instanceof Error ? error.message : String(error),
          duration,
        },
        'Workflow execution failed',
      );

      await this.failRun(runId, error instanceof Error ? error.message : String(error));
    }
  }

  private async executeStep(step: Step, context: RunContext): Promise<any> {
    const startTime = Date.now();
    const stepId = step.id;

    logger.info(
      {
        runId: context.runId,
        stepId,
        stepType: step.type,
        stepOrder: step.order,
      },
      'Executing step',
    );

    // Create input artifact
    const inputData = this.prepareStepInput(step, context);
    await this.createArtifact(context.runId, stepId, 'input', inputData, 'running', startTime);

    let result: any;
    let metrics: any = {};

    try {
      switch (step.type) {
        case 'llm':
          result = await this.executeLLMStep(step, inputData);
          metrics = {
            tokens: result.tokens,
            cost: result.cost,
            model: result.model,
          };
          break;

        case 'tool':
          result = await this.executeToolStep(step, inputData);
          metrics = {
            status: result.status,
            cost: result.cost,
            duration: result.duration,
          };
          break;

        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Create output artifact
      await this.createArtifact(
        context.runId,
        stepId,
        'output',
        result,
        'completed',
        startTime,
        endTime,
        { ...metrics, ms: duration },
      );

      // Store result in context for next steps
      context.stepResults.set(stepId, result);

      logger.info(
        {
          runId: context.runId,
          stepId,
          stepType: step.type,
          duration,
          metrics,
        },
        'Step execution completed',
      );

      return result;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Create error artifact
      await this.createArtifact(
        context.runId,
        stepId,
        'output',
        null,
        'failed',
        startTime,
        endTime,
        { ms: duration },
        error instanceof Error ? error.message : String(error),
      );

      throw error;
    }
  }

  private prepareStepInput(step: Step, context: RunContext): any {
    // For the first step, use the run input
    if (step.order === 0) {
      return context.input;
    }

    // For subsequent steps, use the output from the previous step
    const previousStepId = Array.from(context.stepResults.keys()).pop();
    if (previousStepId) {
      return context.stepResults.get(previousStepId);
    }

    return context.input;
  }

  private async executeLLMStep(step: Step, input: any): Promise<any> {
    const config: LLMConfig = {
      prompt: step.config.prompt || step.config.name || 'Process the following input:',
      model: step.config.model,
      temperature: step.config.temperature,
      maxTokens: step.config.maxTokens,
    };

    await geminiProvider.validateConfig(config);
    const result = await geminiProvider.callLLM(config, input);

    // Parse the response if it's JSON
    try {
      return {
        ...result,
        parsed: JSON.parse(result.content),
      };
    } catch {
      return result;
    }
  }

  private async executeToolStep(step: Step, input: any): Promise<any> {
    const toolName = step.config.name || step.config.tool;
    if (!toolName) {
      throw new Error('Tool name is required for tool steps');
    }

    const config: ToolConfig = {
      name: toolName,
      url: step.config.url,
      method: step.config.method,
      headers: step.config.headers,
      body: step.config.body,
      timeout: step.config.timeout,
    };

    const result = await toolRegistry.executeTool(toolName, config, input);
    return result.data;
  }

  private async createArtifact(
    runId: string,
    stepId: number,
    kind: 'input' | 'output',
    data: any,
    status: 'pending' | 'running' | 'completed' | 'failed',
    startedAt: number,
    finishedAt?: number,
    metrics?: any,
    error?: string,
  ): Promise<void> {
    await db.insert(artifactsTable).values({
      runId,
      stepId,
      kind,
      data: data || {},
      status,
      startedAt: new Date(startedAt),
      finishedAt: finishedAt ? new Date(finishedAt) : undefined,
      metrics: metrics || {},
      error: error ? { message: error } : undefined,
    });
  }

  private async calculateRunMetrics(runId: string): Promise<any> {
    const artifacts = await db.select().from(artifactsTable).where(eq(artifactsTable.runId, runId));

    let totalTokens = 0;
    let totalCost = 0;
    const perStep: any[] = [];

    for (const artifact of artifacts) {
      if (artifact.kind === 'output' && artifact.metrics) {
        const metrics = artifact.metrics as any;

        if (metrics.tokens) totalTokens += metrics.tokens;
        if (metrics.cost) totalCost += metrics.cost;

        perStep.push({
          stepKey: `step_${artifact.stepId}`,
          kind: 'output',
          ms: metrics.ms || 0,
          tokens: metrics.tokens || 0,
          costEstimateUsd: metrics.cost || 0,
          attempts: 1,
        });
      }
    }

    return {
      totalTokens,
      costEstimateUsd: totalCost,
      perStep,
    };
  }

  private async completeRun(runId: string, metrics: any): Promise<void> {
    await db
      .update(runsTable)
      .set({
        status: 'completed',
        finishedAt: new Date(),
        metrics,
      })
      .where(eq(runsTable.id, runId));
  }

  private async failRun(runId: string, reason: string): Promise<void> {
    await db
      .update(runsTable)
      .set({
        status: 'failed',
        finishedAt: new Date(),
        failureReason: reason,
        lastError: { message: reason },
      })
      .where(eq(runsTable.id, runId));
  }
}

// Export a singleton instance
export const workflowExecutor = new WorkflowExecutor();
