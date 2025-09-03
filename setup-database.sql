-- Agent Lab Database Setup Script
-- This script creates all necessary tables for the Agent Lab application

-- Create workflows table
CREATE TABLE IF NOT EXISTS "workflows" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar(128) NOT NULL,
    "version" integer DEFAULT 1 NOT NULL
);

-- Create steps table
CREATE TABLE IF NOT EXISTS "steps" (
    "id" serial PRIMARY KEY NOT NULL,
    "workflow_id" uuid NOT NULL,
    "type" varchar(64) NOT NULL,
    "order" integer NOT NULL,
    "config" jsonb DEFAULT '{}'::jsonb NOT NULL
);

-- Create runs table
CREATE TABLE IF NOT EXISTS "runs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "workflow_id" uuid NOT NULL,
    "status" varchar(32) DEFAULT 'pending' NOT NULL,
    "started_at" timestamp,
    "finished_at" timestamp,
    "metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "input" jsonb,
    "failure_reason" varchar(512),
    "retry_count" integer DEFAULT 0 NOT NULL,
    "max_retries" integer DEFAULT 3 NOT NULL,
    "last_error" jsonb
);

-- Create artifacts table
CREATE TABLE IF NOT EXISTS "artifacts" (
    "id" serial PRIMARY KEY NOT NULL,
    "run_id" uuid NOT NULL,
    "step_id" integer NOT NULL,
    "kind" varchar(64) NOT NULL,
    "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "status" varchar(32) DEFAULT 'pending' NOT NULL,
    "started_at" timestamp,
    "finished_at" timestamp,
    "error" jsonb,
    "retry_count" integer DEFAULT 0 NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_run_id_runs_id_fk" 
    FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_step_id_steps_id_fk" 
    FOREIGN KEY ("step_id") REFERENCES "public"."steps"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "runs" ADD CONSTRAINT "runs_workflow_id_workflows_id_fk" 
    FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "steps" ADD CONSTRAINT "steps_workflow_id_workflows_id_fk" 
    FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_runs_workflow_id" ON "runs" ("workflow_id");
CREATE INDEX IF NOT EXISTS "idx_runs_status" ON "runs" ("status");
CREATE INDEX IF NOT EXISTS "idx_artifacts_run_id" ON "artifacts" ("run_id");
CREATE INDEX IF NOT EXISTS "idx_steps_workflow_id" ON "steps" ("workflow_id");
