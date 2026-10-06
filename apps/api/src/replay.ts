import type { AgentEvent, Comparison } from "@agent-replay/shared";

const stable = (value: unknown): string => JSON.stringify(value, Object.keys((value ?? {}) as object).sort());

export function compareEventStreams(
  baselineRunId: string,
  targetRunId: string,
  baseline: AgentEvent[],
  target: AgentEvent[],
): Comparison {
  const length = Math.max(baseline.length, target.length);
  const rows = Array.from({ length }, (_, sequence) => {
    const left = baseline[sequence] ?? null;
    const right = target[sequence] ?? null;
    const changed = !left || !right || left.type !== right.type || left.name !== right.name ||
      stable(left.output) !== stable(right.output) || left.error !== right.error;
    return { sequence, baseline: left, target: right, changed };
  });
  const firstDivergence = rows.find((row) => row.changed)?.sequence ?? null;
  const summary = firstDivergence === null
    ? "The event streams are behaviorally identical."
    : `The runs first diverge at event ${firstDivergence}.`;
  return { baselineRunId, targetRunId, firstDivergence, summary, rows };
}

export async function* replay(events: AgentEvent[], speed = 1): AsyncGenerator<AgentEvent> {
  let previous: AgentEvent | undefined;
  for (const event of events) {
    if (previous) {
      const elapsed = new Date(event.timestamp).getTime() - new Date(previous.timestamp).getTime();
      await new Promise((resolve) => setTimeout(resolve, Math.min(Math.max(elapsed / speed, 0), 2000)));
    }
    yield event;
    previous = event;
  }
}
