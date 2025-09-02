import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db } from '../db/client';
import { workflows, steps as stepsTable, runs as runsTable, artifacts as artifactsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

const baseLogger = pino({ level: process.env.LOG_LEVEL || 'info' });

function requestId() {
  return async (c: any, next: any) => {
    c.set('requestId', c.req.header('x-request-id') || nanoid());
    await next();
  };
}

const app = new Hono();
app.use('*', cors());
app.use('*', logger());
app.use('*', requestId());
app.use('*', (c, next) => pinoHttp({ logger: baseLogger, genReqId: () => c.get('requestId') })(c.req.raw as any, c.res as any, next as any));

const UpsertWorkflowSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  version: z.number().int().positive().default(1),
  steps: z.array(z.object({
    type: z.string(),
    order: z.number().int().nonnegative(),
    config: z.record(z.any()).default({}),
  })).default([]),
});

app.post('/workflows', async (c) => {
  const body = await c.req.json();
  const parsed = UpsertWorkflowSchema.parse(body);

  let workflowId = parsed.id;
  if (!workflowId) {
    const [w] = await db.insert(workflows).values({ name: parsed.name, version: parsed.version }).returning();
    workflowId = w.id;
  } else {
    await db.update(workflows).set({ name: parsed.name, version: parsed.version }).where(eq(workflows.id, workflowId));
    await db.delete(stepsTable).where(eq(stepsTable.workflowId, workflowId));
  }

  if (parsed.steps.length) {
    await db.insert(stepsTable).values(parsed.steps.map(s => ({ ...s, workflowId })));
  }

  return c.json({ workflowId });
});

app.post('/runs/:workflowId/start', async (c) => {
  const { workflowId } = c.req.param();
  const [run] = await db.insert(runsTable).values({ workflowId, status: 'running', startedAt: new Date(), metrics: {} }).returning();
  return c.json({ runId: run.id });
});

app.get('/runs/:id', async (c) => {
  const { id } = c.req.param();
  const run = (await db.select().from(runsTable).where(eq(runsTable.id, id)).limit(1))[0];
  if (!run) return c.json({ error: 'not found' }, 404);
  const stepRows = await db.select().from(stepsTable).where(eq(stepsTable.workflowId, run.workflowId));
  const artifactRows = await db.select().from(artifactsTable).where(eq(artifactsTable.runId, id));

  const timeline = stepRows.map((s) => ({
    stepId: s.id,
    type: s.type,
    order: s.order,
    status: 'completed',
    metrics: { tokens: 0, ms: 0, cost_estimate: 0 },
    inputs: artifactRows.find(a => a.stepId === s.id && a.kind === 'input')?.data ?? null,
    outputs: artifactRows.find(a => a.stepId === s.id && a.kind === 'output')?.data ?? null,
  })).sort((a, b) => a.order - b.order);

  return c.json({ run, timeline });
});

export default app;
