# Agent Replay

An observability and replay debugger for AI agents. Ingest a run as an immutable event
stream, step through every model/tool interaction, compare a failure with a healthy run,
and ask Gemini for an evidence-grounded root-cause diagnosis.

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1)
![CI](https://github.com/abshir1245/ai-agent-replay-debugger/actions/workflows/ci.yml/badge.svg)

## Why this project exists

AI agents fail across multiple boundaries: model decisions, malformed tool arguments,
stale data, guardrails, and application errors. Normal logs show isolated messages;
Agent Replay reconstructs the causal sequence and exposes the first behavioral divergence.

## Features

- Event-sourced agent traces covering prompts, model responses, tools, guardrails, and errors
- Interactive timeline with step inspection and speed-controlled server-sent-event replay
- Failed-versus-successful run comparison with automatic first-divergence detection
- Gemini structured-output analysis with confidence, category, causal event, and remediations
- Transactional PostgreSQL ingestion, JSONB payloads, GIN indexes, and parameterized queries
- Runtime Zod validation shared between the TypeScript API and React client
- Seeded failure scenario, Docker Compose, tests, production builds, and GitHub Actions CI

## Architecture

```text
Agent / SDK                     Replay API                     Debugger UI
    │                               │                              │
    ├── POST run + events ─────────►│ PostgreSQL event store       │
    │                               ├──── run + ordered events ───►│ timeline
    │                               ├──── SSE replay ─────────────►│ playback
    │                               ├──── compare streams ────────►│ divergence
    │                               └──── Gemini diagnosis ───────►│ root cause
```

## Stack

- TypeScript, Node.js, Fastify, Zod
- React 19 and Vite
- PostgreSQL 17 with JSONB
- Google GenAI SDK and Gemini structured outputs
- Vitest, Testing Library, Docker Compose, GitHub Actions

## Run locally

Requirements: Node.js 22+, Docker Desktop, and optionally a Gemini API key.

```bash
git clone <your-repository-url>
cd ai-agent-replay-debugger
cp .env.example .env
npm install
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The seeded runs work without an API
key. Add `GEMINI_API_KEY` to `.env` before using **Diagnose**.

## API

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/runs` | Validate and transactionally ingest a trace |
| `GET` | `/api/runs` | List runs and aggregate reliability metrics |
| `GET` | `/api/runs/:id` | Fetch an ordered event timeline |
| `GET` | `/api/runs/:id/replay` | Replay events over SSE |
| `POST` | `/api/runs/:id/diagnose` | Generate and persist AI root-cause analysis |
| `GET` | `/api/compare?baseline=&target=` | Find the first behavioral divergence |

## Ingest your own run

```bash
curl -X POST http://localhost:4000/api/runs \
  -H 'content-type: application/json' \
  --data @examples/run.json
```

Event payloads are validated at the boundary and written within one database transaction,
so partially ingested traces cannot appear in the debugger.

## Test and build

```bash
npm run lint
npm test
npm run build
```

## Resume bullets

- Built an event-sourced observability platform in TypeScript and PostgreSQL that replays
  AI-agent model/tool interactions and identifies the first divergence between healthy and
  failed executions.
- Implemented structured Gemini root-cause analysis, SSE playback, transactional JSONB
  ingestion, runtime schema validation, and a React timeline debugger.
- Shipped the system with Docker-based local infrastructure, deterministic seeded failures,
  automated tests, and GitHub Actions CI.

## Responsible use

Trace payloads may contain private prompts, credentials, or customer data. Redact secrets at
the instrumentation boundary and configure authentication and retention before production use.
