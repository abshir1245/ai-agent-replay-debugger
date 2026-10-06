import type { AgentEvent } from "@agent-replay/shared";

const Json = ({ label, value }: { label: string; value: unknown }) => value === undefined || value === null
  ? null
  : <section><h4>{label}</h4><pre>{JSON.stringify(value, null, 2)}</pre></section>;

export function EventInspector({ event }: { event: AgentEvent | undefined }) {
  if (!event) return <div className="empty">Select an event to inspect its payload.</div>;
  return <div className="inspector">
    <div className="inspector-heading"><span className="eyebrow">Event {event.sequence}</span><h2>{event.name}</h2></div>
    {event.error && <div className="error-callout"><strong>Failure</strong><p>{event.error}</p></div>}
    <div className="metrics"><div><span>Type</span><strong>{event.type}</strong></div><div><span>Duration</span><strong>{event.durationMs ?? 0} ms</strong></div></div>
    <Json label="Input" value={event.input}/><Json label="Output" value={event.output}/><Json label="Metadata" value={event.metadata}/>
  </div>;
}
