import type { CreateRun } from "@agent-replay/shared";
import { pool } from "../db.js";
import { insertRun } from "../repository.js";

const started = new Date(Date.now() - 180_000);
const at = (seconds: number) => new Date(started.getTime() + seconds * 1000).toISOString();
const base = {
  agentName: "support-resolution-agent",
  environment: "production",
  model: "gemini-2.5-flash",
  prompt: "Refund duplicate charge for customer order #A-1042",
  startedAt: at(0),
  metadata: { release: "2026.10.4", tenant: "demo-store" },
};
const successful: CreateRun = {
  ...base, externalId: `demo-success-${Date.now()}`, status: "passed", completedAt: at(4),
  events: [
    { sequence: 0, type: "run.started", timestamp: at(0), durationMs: 0, name: "start", error: null, metadata: {} },
    { sequence: 1, type: "model.request", timestamp: at(1), durationMs: 420, name: "plan", input: { orderId: "A-1042" }, error: null, metadata: { tokens: 186 } },
    { sequence: 2, type: "tool.called", timestamp: at(2), durationMs: 85, name: "lookup_order", input: { orderId: "A-1042" }, error: null, metadata: {} },
    { sequence: 3, type: "tool.returned", timestamp: at(2.2), durationMs: 85, name: "lookup_order", output: { chargeId: "ch_91", duplicate: true, currency: "USD" }, error: null, metadata: {} },
    { sequence: 4, type: "tool.called", timestamp: at(3), durationMs: 240, name: "issue_refund", input: { chargeId: "ch_91", amount: 4900, currency: "USD" }, error: null, metadata: {} },
    { sequence: 5, type: "run.completed", timestamp: at(4), durationMs: 0, name: "complete", output: { message: "Refund issued" }, error: null, metadata: {} },
  ],
};
const failed: CreateRun = {
  ...base, externalId: `demo-failure-${Date.now()}`, status: "failed", completedAt: at(5),
  events: [
    ...successful.events.slice(0, 4),
    { sequence: 4, type: "model.response", timestamp: at(3), durationMs: 510, name: "plan", output: { tool: "issue_refund", arguments: { chargeId: "ch_91", amount: 4900, currency: "EUR" } }, error: null, metadata: { tokens: 244 } },
    { sequence: 5, type: "tool.called", timestamp: at(4), durationMs: 300, name: "issue_refund", input: { chargeId: "ch_91", amount: 4900, currency: "EUR" }, error: null, metadata: {} },
    { sequence: 6, type: "error", timestamp: at(4.3), durationMs: 0, name: "currency_mismatch", error: "Expected USD but received EUR", metadata: { retryable: false } },
    { sequence: 7, type: "run.completed", timestamp: at(5), durationMs: 0, name: "complete", output: { status: "escalated" }, error: null, metadata: {} },
  ],
};
await insertRun(successful);
await insertRun(failed);
console.log("Seeded one successful and one failed agent run");
await pool.end();
