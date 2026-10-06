CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT NOT NULL UNIQUE,
  agent_name TEXT NOT NULL,
  environment TEXT NOT NULL,
  model TEXT,
  prompt TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'passed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_events (
  id BIGSERIAL PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL CHECK (sequence >= 0),
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  name TEXT NOT NULL,
  input JSONB,
  output JSONB,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  UNIQUE (run_id, sequence)
);

CREATE TABLE IF NOT EXISTS diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  diagnosis JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_runs_started ON agent_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_status ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_events_run_sequence ON agent_events(run_id, sequence);
CREATE INDEX IF NOT EXISTS idx_events_payload ON agent_events USING GIN(metadata);
