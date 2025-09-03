ALTER TABLE "artifacts" ADD COLUMN "metrics" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "artifacts" ADD COLUMN "status" varchar(32) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "artifacts" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "artifacts" ADD COLUMN "finished_at" timestamp;--> statement-breakpoint
ALTER TABLE "artifacts" ADD COLUMN "error" jsonb;--> statement-breakpoint
ALTER TABLE "artifacts" ADD COLUMN "retry_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "input" jsonb;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "failure_reason" varchar(512);--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "retry_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "max_retries" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "last_error" jsonb;