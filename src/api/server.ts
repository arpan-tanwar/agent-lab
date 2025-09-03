import { Hono } from 'hono';
import type { MiddlewareHandler } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import pino from 'pino';
// pino-http is optional; we'll log manually per request for types simplicity
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db } from '../db/client.js';
import {
  workflows,
  steps as stepsTable,
  runs as runsTable,
  artifacts as artifactsTable,
} from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { createRetryLogger } from '../utils/retry.js';

const baseLogger = pino({ level: process.env.LOG_LEVEL || 'info' });

type AppEnv = { Variables: { requestId: string } };

function requestId(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    c.set('requestId', c.req.header('x-request-id') || nanoid());
    await next();
  };
}

const app = new Hono<AppEnv>();
app.use('*', cors());
app.use('*', logger());
app.use('*', requestId());
app.use('*', async (c, next) => {
  const reqId = c.get('requestId');
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  baseLogger.info({ reqId, path: c.req.path, method: c.req.method, ms }, 'request completed');
});

app.get('/health', (c) => c.json({ ok: true }));

const UpsertWorkflowSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  version: z.number().int().positive().default(1),
  steps: z
    .array(
      z.object({
        type: z.string(),
        order: z.number().int().nonnegative(),
        config: z.record(z.string(), z.any()).default({}),
      }),
    )
    .default([]),
});

app.post('/workflows', async (c) => {
  const body = await c.req.json();
  const parsed = UpsertWorkflowSchema.parse(body);

  let workflowId = parsed.id;
  if (!workflowId) {
    const [w] = await db
      .insert(workflows)
      .values({ name: parsed.name, version: parsed.version })
      .returning();
    workflowId = w.id;
  } else {
    await db
      .update(workflows)
      .set({ name: parsed.name, version: parsed.version })
      .where(eq(workflows.id, workflowId));
    await db.delete(stepsTable).where(eq(stepsTable.workflowId, workflowId));
  }

  if (parsed.steps.length) {
    await db.insert(stepsTable).values(parsed.steps.map((s) => ({ ...s, workflowId })));
  }

  return c.json({ workflowId });
});

app.post('/runs/:workflowId/start', async (c) => {
  const { workflowId } = c.req.param();
  const [run] = await db
    .insert(runsTable)
    .values({ workflowId, status: 'running', startedAt: new Date(), metrics: {} })
    .returning();
  return c.json({ runId: run.id });
});

// Enhanced endpoint for automation tools (Zapier/n8n)
app.post('/automation/lead', async (c) => {
  try {
    const body = await c.req.json();
    const { subject, from, body: emailBody } = body;

    if (!subject || !from || !emailBody) {
      return c.json({ error: 'Missing required fields: subject, from, body' }, 400);
    }

    // Find or create the lead workflow
    let leadWorkflow = (
      await db.select().from(workflows).where(eq(workflows.name, 'lead-triage')).limit(1)
    )[0];

    if (!leadWorkflow) {
      // Create the lead workflow if it doesn't exist
      const [newWorkflow] = await db
        .insert(workflows)
        .values({ name: 'lead-triage', version: 1 })
        .returning();
      leadWorkflow = newWorkflow;

      // Add the workflow steps
      const steps = [
        { type: 'llm', order: 0, config: { name: 'parseEmail' } },
        { type: 'tool', order: 1, config: { name: 'enrichCompany' } },
        { type: 'tool', order: 2, config: { name: 'scoreLead' } },
        { type: 'tool', order: 3, config: { name: 'createCRMRecord' } },
        { type: 'tool', order: 4, config: { name: 'notifySlack' } },
      ];

      await db.insert(stepsTable).values(steps.map((s) => ({ ...s, workflowId: leadWorkflow.id })));
    }

    // Start the workflow run
    const [run] = await db
      .insert(runsTable)
      .values({
        workflowId: leadWorkflow.id,
        status: 'running',
        startedAt: new Date(),
        metrics: {},
        input: { subject, from, body: emailBody },
      })
      .returning();

    return c.json({
      success: true,
      runId: run.id,
      workflowId: leadWorkflow.id,
      message: 'Lead processing started successfully',
    });
  } catch (error) {
    baseLogger.error({ error }, 'Failed to process lead automation');
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get('/runs/:id', async (c) => {
  const { id } = c.req.param();
  const requestId = c.get('requestId');
  const retryLogger = createRetryLogger(requestId);

  try {
    const run = (await db.select().from(runsTable).where(eq(runsTable.id, id)).limit(1))[0];
    if (!run) {
      retryLogger.warn('Run not found', { runId: id });
      return c.json({ error: 'not found' }, 404);
    }

    const stepRows = await db
      .select()
      .from(stepsTable)
      .where(eq(stepsTable.workflowId, run.workflowId));
    const artifactRows = await db.select().from(artifactsTable).where(eq(artifactsTable.runId, id));

    const timeline = stepRows
      .map((s) => {
        const inputArtifact = artifactRows.find((a) => a.stepId === s.id && a.kind === 'input');
        const outputArtifact = artifactRows.find((a) => a.stepId === s.id && a.kind === 'output');

        return {
          stepId: s.id,
          type: s.type,
          order: s.order,
          status: outputArtifact?.status || 'pending',
          metrics: outputArtifact?.metrics || { tokens: 0, ms: 0, cost_estimate: 0 },
          inputs: inputArtifact?.data ?? null,
          outputs: outputArtifact?.data ?? null,
          error: outputArtifact?.error ?? null,
          retryCount: outputArtifact?.retryCount || 0,
          startedAt: outputArtifact?.startedAt,
          finishedAt: outputArtifact?.finishedAt,
        };
      })
      .sort((a, b) => a.order - b.order);

    retryLogger.info('Run retrieved successfully', {
      runId: id,
      status: run.status,
      stepCount: timeline.length,
      hasErrors: timeline.some((t) => t.error),
    });

    return c.json({ run, timeline });
  } catch (error) {
    retryLogger.error('Failed to retrieve run', {
      runId: id,
      error: error instanceof Error ? error.message : String(error),
    });
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get('/workflows', async (c) => {
  const rows = await db.select().from(workflows);
  return c.json({ workflows: rows });
});

// Retry failed run endpoint
app.post('/runs/:id/retry', async (c) => {
  const { id } = c.req.param();
  const requestId = c.get('requestId');
  const retryLogger = createRetryLogger(requestId);

  try {
    const run = (await db.select().from(runsTable).where(eq(runsTable.id, id)).limit(1))[0];
    if (!run) {
      retryLogger.warn('Run not found for retry', { runId: id });
      return c.json({ error: 'Run not found' }, 404);
    }

    if (run.retryCount >= run.maxRetries) {
      retryLogger.warn('Max retries exceeded', {
        runId: id,
        retryCount: run.retryCount,
        maxRetries: run.maxRetries,
      });
      return c.json({ error: 'Maximum retries exceeded' }, 400);
    }

    // Create new run with incremented retry count
    const [newRun] = await db
      .insert(runsTable)
      .values({
        workflowId: run.workflowId,
        status: 'running',
        startedAt: new Date(),
        metrics: {},
        input: run.input,
        retryCount: run.retryCount + 1,
        maxRetries: run.maxRetries,
        failureReason: null,
        lastError: null,
      })
      .returning();

    retryLogger.info('Run retry initiated', {
      originalRunId: id,
      newRunId: newRun.id,
      retryCount: newRun.retryCount,
      maxRetries: newRun.maxRetries,
    });

    return c.json({
      success: true,
      runId: newRun.id,
      retryCount: newRun.retryCount,
      message: 'Run retry started successfully',
    });
  } catch (error) {
    retryLogger.error('Failed to retry run', {
      runId: id,
      error: error instanceof Error ? error.message : String(error),
    });
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get failed runs for dead letter queue
app.get('/runs/failed', async (c) => {
  const requestId = c.get('requestId');
  const retryLogger = createRetryLogger(requestId);

  try {
    const failedRuns = await db.select().from(runsTable).where(eq(runsTable.status, 'failed'));

    retryLogger.info('Retrieved failed runs', { count: failedRuns.length });

    return c.json({
      failedRuns: failedRuns.map((run) => ({
        id: run.id,
        workflowId: run.workflowId,
        status: run.status,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        failureReason: run.failureReason,
        retryCount: run.retryCount,
        maxRetries: run.maxRetries,
        lastError: run.lastError,
      })),
    });
  } catch (error) {
    retryLogger.error('Failed to retrieve failed runs', {
      error: error instanceof Error ? error.message : String(error),
    });
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;
