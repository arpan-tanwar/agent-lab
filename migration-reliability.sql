-- Migration to add reliability and observability fields
-- Run this on your database to support enhanced logging and retry functionality

-- Add fields to runs table
ALTER TABLE runs ADD COLUMN failure_reason VARCHAR(512);
ALTER TABLE runs ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE runs ADD COLUMN max_retries INTEGER NOT NULL DEFAULT 3;
ALTER TABLE runs ADD COLUMN last_error JSONB;

-- Add fields to artifacts table for step-level tracking
ALTER TABLE artifacts ADD COLUMN metrics JSONB NOT NULL DEFAULT '{}';
ALTER TABLE artifacts ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'pending';
ALTER TABLE artifacts ADD COLUMN started_at TIMESTAMP;
ALTER TABLE artifacts ADD COLUMN finished_at TIMESTAMP;
ALTER TABLE artifacts ADD COLUMN error JSONB;
ALTER TABLE artifacts ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;
