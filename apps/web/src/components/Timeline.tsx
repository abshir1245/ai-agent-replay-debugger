import type { AgentEvent } from "@agent-replay/shared";

const icon: Record<string, string> = {
  "run.started": "▶", "model.request": "◇", "model.response": "◆", "tool.called": "↗",
  "tool.returned": "↙", "guardrail.triggered": "⬡", error: "!", "run.completed": "■",
};

export function Timeline({ events, active, onSelect }: { events: AgentEvent[]; active: number; onSelect: (index: number) => void }) {
  return <div className="timeline" aria-label="Agent event timeline">
    {events.map((event, index) => <button
      className={`event ${event.type === "error" || event.error ? "danger" : ""} ${index === active ? "active" : ""}`}
      key={`${event.sequence}-${event.type}`} onClick={() => onSelect(index)}
    >
      <span className="event-icon">{icon[event.type]}</span>
      <span className="event-content"><strong>{event.name}</strong><small>{event.type} · {event.durationMs ?? 0}ms</small></span>
      <span className="sequence">{String(event.sequence).padStart(2, "0")}</span>
    </button>)}
  </div>;
}
