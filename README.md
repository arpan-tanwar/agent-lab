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
# 3) typecheck
pnpm typecheck
# 4) run tests
pnpm test
# 5) start local dev (API + Web to be added next steps)
pnpm dev
```

## Demo
Placeholder for a 90-sec Loom link (to be added after initial demo).
