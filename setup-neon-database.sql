-- Agent Lab Database Setup for Neon PostgreSQL
-- This script creates all necessary tables and indexes for the Agent Lab application

-- Enable UUID extension (required for UUID generation)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create workflows table
CREATE TABLE IF NOT EXISTS "workflows" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    "name" varchar(128) NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create steps table
CREATE TABLE IF NOT EXISTS "steps" (
    "id" serial PRIMARY KEY NOT NULL,
    "workflow_id" uuid NOT NULL,
    "type" varchar(64) NOT NULL,
    "order" integer NOT NULL,
    "config" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create runs table
CREATE TABLE IF NOT EXISTS "runs" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    "workflow_id" uuid NOT NULL,
    "status" varchar(32) DEFAULT 'pending' NOT NULL,
    "started_at" timestamp,
    "finished_at" timestamp,
    "metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "input" jsonb,
    "failure_reason" varchar(512),
    "retry_count" integer DEFAULT 0 NOT NULL,
    "max_retries" integer DEFAULT 3 NOT NULL,
    "last_error" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
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
    "retry_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
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
CREATE INDEX IF NOT EXISTS "idx_workflows_created_at" ON "workflows" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_runs_workflow_id" ON "runs" ("workflow_id");
CREATE INDEX IF NOT EXISTS "idx_runs_status" ON "runs" ("status");
CREATE INDEX IF NOT EXISTS "idx_runs_created_at" ON "runs" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_artifacts_run_id" ON "artifacts" ("run_id");
CREATE INDEX IF NOT EXISTS "idx_artifacts_status" ON "artifacts" ("status");
CREATE INDEX IF NOT EXISTS "idx_steps_workflow_id" ON "steps" ("workflow_id");
CREATE INDEX IF NOT EXISTS "idx_steps_order" ON "steps" ("workflow_id", "order");

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_runs_updated_at BEFORE UPDATE ON runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO "workflows" ("name", "version") VALUES 
    ('Lead Triage', 1),
    ('Ticket Summarizer', 1),
    ('Email Responder', 1)
ON CONFLICT DO NOTHING;

-- Insert sample steps for Lead Triage workflow
INSERT INTO "steps" ("workflow_id", "type", "order", "config")
SELECT 
    w.id,
    'email_parser',
    1,
    '{"extractFields": ["subject", "from", "body"]}'::jsonb
FROM "workflows" w WHERE w.name = 'Lead Triage'
ON CONFLICT DO NOTHING;

INSERT INTO "steps" ("workflow_id", "type", "order", "config")
SELECT 
    w.id,
    'lead_scorer',
    2,
    '{"model": "gpt-4", "temperature": 0.1}'::jsonb
FROM "workflows" w WHERE w.name = 'Lead Triage'
ON CONFLICT DO NOTHING;

INSERT INTO "steps" ("workflow_id", "type", "order", "config")
SELECT 
    w.id,
    'crm_upsert',
    3,
    '{"crmType": "salesforce", "autoCreate": true}'::jsonb
FROM "workflows" w WHERE w.name = 'Lead Triage'
ON CONFLICT DO NOTHING;

-- Verify tables were created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('workflows', 'runs', 'steps', 'artifacts')
ORDER BY table_name, ordinal_position;
