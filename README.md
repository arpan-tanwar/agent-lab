# agent-lab

## Problem
Ops work is manual/fragmented; we want agents that are observable, testable, and cheap.

## Solution
A tiny agent runner + two workflows; strict JSON I/O and regression tests.

## Stack
TypeScript • Hono • Drizzle • Postgres (Neon) • Railway • Next.js • shadcn • TanStack • Zustand.

## Quickstart
Run API + Web locally (placeholder commands until code lands):

```bash
# 1) install deps
pnpm install
# 2) generate envs (or copy .env.example)
cp .env.example .env || true
# 3) set DATABASE_URL from Neon in .env
#    DATABASE_URL=postgres://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require
# 4) run migrations
pnpm migrate
# 5) typecheck
pnpm typecheck
# 6) run tests
pnpm test
# 7) start API locally
pnpm dev
```

## Demo
Placeholder for a 90-sec Loom link (to be added after initial demo).

### API demo (curl)

Replace YOUR_API_BASE with Railway URL once deployed.

```bash
API="https://YOUR_API_BASE" # or http://localhost:8787

# upsert a workflow with two steps
curl -s -X POST "$API/workflows" -H 'content-type: application/json' -d '{
  "name": "lead-triage",
  "version": 1,
  "steps": [
    { "type": "tool", "order": 0, "config": { "name": "ingest" } },
    { "type": "llm", "order": 1, "config": { "prompt": "classify" } }
  ]
}' | tee /tmp/workflow.json

WF=$(cat /tmp/workflow.json | jq -r .workflowId)

# start a run
curl -s -X POST "$API/runs/$WF/start" | tee /tmp/run.json

RUN=$(cat /tmp/run.json | jq -r .runId)

# get timeline
curl -s "$API/runs/$RUN" | jq
```
