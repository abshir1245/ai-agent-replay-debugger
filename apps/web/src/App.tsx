import type { Diagnosis, RunDetail, RunSummary } from "@agent-replay/shared";
import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { EventInspector } from "./components/EventInspector";
import { Timeline } from "./components/Timeline";

const duration = (ms: number | null) => ms === null ? "—" : ms > 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

export default function App() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [run, setRun] = useState<RunDetail>();
  const [active, setActive] = useState(0);
  const [replaying, setReplaying] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { api.listRuns().then((items) => { setRuns(items); if (items[0]) void selectRun(items[0].id); }).catch((e: Error) => setError(e.message)); }, []);
  const selectRun = async (id: string) => { setError(""); setDiagnosis(undefined); setActive(0); try { setRun(await api.getRun(id)); } catch (e) { setError((e as Error).message); } };
  const replay = () => {
    if (!run || replaying) return;
    setError("");
    setActive(0); setReplaying(true);
    const stream = new EventSource(api.replayUrl(run.id));
    let index = 0;
    stream.onmessage = () => { setActive(index++); if (index >= run.events.length) { stream.close(); setReplaying(false); } };
    stream.onerror = () => { stream.close(); setReplaying(false); };
  };
  const diagnose = async () => { if (!run) return; setBusy(true); setError(""); try { setDiagnosis(await api.diagnose(run.id)); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } };
  const failures = useMemo(() => run?.events.filter((event) => event.type === "error" || event.error).length ?? 0, [run]);

  return <main>
    <header><div className="brand"><span className="mark">AR</span><div><strong>Agent Replay</strong><small>Runtime debugger</small></div></div><div className="live"><i/> Connected</div></header>
    <div className="layout">
      <aside><div className="aside-title"><span>RUNS</span><span>{runs.length}</span></div>{runs.map((item) => <button key={item.id} onClick={() => void selectRun(item.id)} className={`run-card ${run?.id === item.id ? "selected" : ""}`}><span className={`status-dot ${item.status}`}/><span><strong>{item.agentName}</strong><small>{item.externalId}</small></span><time>{new Date(item.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></button>)}</aside>
      <section className="workspace">
        {error && <div className="banner">{error}</div>}
        {run ? <>
          <div className="run-header"><div><span className="eyebrow">{run.environment} / {run.externalId}</span><h1>{run.agentName}</h1><p>{run.prompt}</p></div><div className="actions"><button className="secondary" onClick={() => void diagnose()} disabled={busy}>{busy ? "Analyzing…" : "✦ Diagnose"}</button><button className="primary" onClick={replay} disabled={replaying}>{replaying ? "Replaying…" : "▶ Replay run"}</button></div></div>
          <div className="stats"><div><span>Status</span><strong className={run.status}>{run.status}</strong></div><div><span>Duration</span><strong>{duration(run.durationMs)}</strong></div><div><span>Events</span><strong>{run.eventCount}</strong></div><div><span>Failures</span><strong>{failures}</strong></div><div><span>Model</span><strong>{run.model ?? "—"}</strong></div></div>
          {diagnosis && <div className="diagnosis"><div><span className="eyebrow">AI ROOT-CAUSE ANALYSIS · {Math.round(diagnosis.confidence * 100)}% CONFIDENCE</span><h3>{diagnosis.summary}</h3><p>{diagnosis.rootCause}</p></div><ul>{diagnosis.recommendations.map((item) => <li key={item}>{item}</li>)}</ul></div>}
          <div className="debugger"><div className="panel-title"><span>EXECUTION TRACE</span><span>EVENT {active + 1} OF {run.events.length}</span></div><div className="debug-grid"><Timeline events={run.events} active={active} onSelect={setActive}/><EventInspector event={run.events[active]}/></div></div>
        </> : <div className="empty-page">Loading agent runs…</div>}
      </section>
    </div>
  </main>;
}
