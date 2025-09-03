-- Migration to add input field to runs table
-- Run this on your database to support the automation endpoint

ALTER TABLE runs ADD COLUMN input JSONB;
