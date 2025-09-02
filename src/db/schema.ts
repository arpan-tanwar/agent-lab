import { pgTable, serial, varchar, integer, jsonb, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const workflows = pgTable('workflows', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  version: integer('version').notNull().default(1),
});

export const steps = pgTable('steps', {
  id: serial('id').primaryKey(),
  workflowId: uuid('workflow_id')
    .notNull()
    .references(() => workflows.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 64 }).notNull(),
  order: integer('order').notNull(),
  config: jsonb('config').notNull().default({}),
});

export const runs = pgTable('runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowId: uuid('workflow_id')
    .notNull()
    .references(() => workflows.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  startedAt: timestamp('started_at', { mode: 'date' }),
  finishedAt: timestamp('finished_at', { mode: 'date' }),
  metrics: jsonb('metrics').notNull().default({}),
});

export const artifacts = pgTable('artifacts', {
  id: serial('id').primaryKey(),
  runId: uuid('run_id')
    .notNull()
    .references(() => runs.id, { onDelete: 'cascade' }),
  stepId: integer('step_id')
    .notNull()
    .references(() => steps.id, { onDelete: 'cascade' }),
  kind: varchar('kind', { length: 64 }).notNull(),
  data: jsonb('data').notNull().default({}),
});

export const workflowsRelations = relations(workflows, ({ many }) => ({
  steps: many(steps),
  runs: many(runs),
}));

export const runsRelations = relations(runs, ({ many, one }) => ({
  workflow: one(workflows, { fields: [runs.workflowId], references: [workflows.id] }),
  artifacts: many(artifacts),
}));

export const stepsRelations = relations(steps, ({ one }) => ({
  workflow: one(workflows, { fields: [steps.workflowId], references: [workflows.id] }),
}));

export type Workflow = typeof workflows.$inferSelect;
export type Run = typeof runs.$inferSelect;
export type Step = typeof steps.$inferSelect;
export type Artifact = typeof artifacts.$inferSelect;
