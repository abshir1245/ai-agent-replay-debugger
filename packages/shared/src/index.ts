import { z } from "zod";

export const eventTypes = [
  "run.started",
  "model.request",
  "model.response",
  "tool.called",
  "tool.returned",
  "guardrail.triggered",
  "error",
  "run.completed",
] as const;

export const runStatuses = ["running", "passed", "failed"] as const;

export const agentEventSchema = z.object({
  sequence: z.number().int().nonnegative(),
  type: z.enum(eventTypes),
  timestamp: z.iso.datetime(),
  durationMs: z.number().int().nonnegative().nullable().default(null),
  name: z.string().min(1),
  input: z.unknown().optional(),
  output: z.unknown().optional(),
  error: z.string().nullable().default(null),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const createRunSchema = z.object({
  externalId: z.string().min(1).max(200),
  agentName: z.string().min(1).max(120),
  environment: z.string().min(1).max(80).default("development"),
  model: z.string().max(120).nullable().default(null),
  prompt: z.string().min(1),
  status: z.enum(runStatuses),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable().default(null),
  events: z.array(agentEventSchema).max(5000),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const diagnosisSchema = z.object({
  summary: z.string(),
  rootCause: z.string(),
  confidence: z.number().min(0).max(1),
  failureEventSequence: z.number().int().nonnegative().nullable(),
  category: z.enum(["model", "tool", "data", "guardrail", "timeout", "application", "unknown"]),
  recommendations: z.array(z.string()).min(1).max(5),
});

export type AgentEvent = z.infer<typeof agentEventSchema>;
export type CreateRun = z.infer<typeof createRunSchema>;
export type Diagnosis = z.infer<typeof diagnosisSchema>;

export interface RunSummary {
  id: string;
  externalId: string;
  agentName: string;
  environment: string;
  model: string | null;
  prompt: string;
  status: (typeof runStatuses)[number];
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  eventCount: number;
  errorCount: number;
}

export interface RunDetail extends RunSummary {
  metadata: Record<string, unknown>;
  events: AgentEvent[];
}

export interface Comparison {
  baselineRunId: string;
  targetRunId: string;
  firstDivergence: number | null;
  summary: string;
  rows: Array<{
    sequence: number;
    baseline: AgentEvent | null;
    target: AgentEvent | null;
    changed: boolean;
  }>;
}
