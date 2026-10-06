import type { AgentEvent, CreateRun, Diagnosis, RunDetail, RunSummary } from "@agent-replay/shared";
import { pool, withTransaction } from "./db.js";

const mapSummary = (row: Record<string, unknown>): RunSummary => ({
  id: String(row.id),
  externalId: String(row.external_id),
  agentName: String(row.agent_name),
  environment: String(row.environment),
  model: row.model === null ? null : String(row.model),
  prompt: String(row.prompt),
  status: row.status as RunSummary["status"],
  startedAt: new Date(String(row.started_at)).toISOString(),
  completedAt: row.completed_at ? new Date(String(row.completed_at)).toISOString() : null,
  durationMs: row.duration_ms === null ? null : Number(row.duration_ms),
  eventCount: Number(row.event_count),
  errorCount: Number(row.error_count),
});

export async function listRuns(status?: string): Promise<RunSummary[]> {
  const result = await pool.query(
    `SELECT r.*, EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000 AS duration_ms,
       COUNT(e.id) AS event_count,
       COUNT(e.id) FILTER (WHERE e.event_type = 'error' OR e.error IS NOT NULL) AS error_count
     FROM agent_runs r LEFT JOIN agent_events e ON e.run_id = r.id
     WHERE ($1::text IS NULL OR r.status = $1)
     GROUP BY r.id ORDER BY r.started_at DESC LIMIT 100`,
    [status ?? null],
  );
  return result.rows.map(mapSummary);
}

export async function getRun(id: string): Promise<RunDetail | null> {
  const runs = await pool.query(
    `SELECT r.*, EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000 AS duration_ms,
       COUNT(e.id) AS event_count,
       COUNT(e.id) FILTER (WHERE e.event_type = 'error' OR e.error IS NOT NULL) AS error_count
     FROM agent_runs r LEFT JOIN agent_events e ON e.run_id = r.id
     WHERE r.id = $1 GROUP BY r.id`,
    [id],
  );
  if (!runs.rows[0]) return null;
  const events = await pool.query("SELECT * FROM agent_events WHERE run_id = $1 ORDER BY sequence", [id]);
  return {
    ...mapSummary(runs.rows[0]),
    metadata: runs.rows[0].metadata as Record<string, unknown>,
    events: events.rows.map((row): AgentEvent => ({
      sequence: row.sequence,
      type: row.event_type,
      timestamp: new Date(row.occurred_at).toISOString(),
      durationMs: row.duration_ms,
      name: row.name,
      input: row.input,
      output: row.output,
      error: row.error,
      metadata: row.metadata,
    })),
  };
}

export async function insertRun(run: CreateRun): Promise<string> {
  return withTransaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO agent_runs
       (external_id, agent_name, environment, model, prompt, status, started_at, completed_at, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [run.externalId, run.agentName, run.environment, run.model, run.prompt, run.status,
        run.startedAt, run.completedAt, run.metadata],
    );
    const id = String(inserted.rows[0].id);
    for (const event of run.events) {
      await client.query(
        `INSERT INTO agent_events
         (run_id, sequence, event_type, occurred_at, duration_ms, name, input, output, error, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, event.sequence, event.type, event.timestamp, event.durationMs, event.name,
          event.input ?? null, event.output ?? null, event.error, event.metadata],
      );
    }
    return id;
  });
}

export async function saveDiagnosis(runId: string, model: string, diagnosis: Diagnosis): Promise<void> {
  await pool.query("INSERT INTO diagnoses(run_id, model, diagnosis) VALUES ($1,$2,$3)", [runId, model, diagnosis]);
}
