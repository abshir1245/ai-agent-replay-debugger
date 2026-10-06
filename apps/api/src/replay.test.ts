import type { AgentEvent } from "@agent-replay/shared";
import { describe, expect, it } from "vitest";
import { compareEventStreams } from "./replay.js";

const event = (sequence: number, output: unknown = {}): AgentEvent => ({
  sequence, type: "tool.returned", timestamp: new Date(sequence * 1000).toISOString(),
  durationMs: 10, name: "lookup", output, error: null, metadata: {},
});

describe("compareEventStreams", () => {
  it("finds the first behavioral divergence", () => {
    const comparison = compareEventStreams("good", "bad", [event(0), event(1, { currency: "USD" })], [event(0), event(1, { currency: "EUR" })]);
    expect(comparison.firstDivergence).toBe(1);
    expect(comparison.rows[1]?.changed).toBe(true);
  });
  it("recognizes equivalent streams", () => {
    expect(compareEventStreams("a", "b", [event(0)], [event(0)]).firstDivergence).toBeNull();
  });
});
