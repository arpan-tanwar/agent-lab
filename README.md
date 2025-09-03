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

### 🚀 Live Application

- **Frontend**: [Your Vercel URL] (Next.js dashboard)
- **API**: https://agent-lab-production.up.railway.app

### 📧 Email Automation Setup

**Quick Setup (6 steps, <15 minutes):**

1. **Choose your tool**: [Zapier](https://zapier.com) (easier) or [n8n](https://n8n.io) (more flexible)
2. **Set up Gmail trigger**: Monitor emails with "Leads" label
3. **Configure webhook**: POST to `https://agent-lab-production.up.railway.app/automation/lead`
4. **Map email data**: Send `{subject, from, body}` to API
5. **Test**: Send yourself a test email with "Leads" label
6. **Activate**: Your automation is live!

**📖 Detailed Guide**: See [AUTOMATION_SETUP.md](./AUTOMATION_SETUP.md) for complete setup instructions with screenshots.

**🧪 Test the API**:

```bash
# Test automation endpoint
curl -X POST https://agent-lab-production.up.railway.app/automation/lead \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Interested in pricing",
    "from": "lead@company.com",
    "body": "Hi, we are interested in your product pricing."
  }'
```

### API demo (curl)

Live API base: https://agent-lab-production.up.railway.app

```bash
API="https://agent-lab-production.up.railway.app" # or http://localhost:8787

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
