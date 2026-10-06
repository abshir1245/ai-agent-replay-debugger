import type { Comparison, Diagnosis, RunDetail, RunSummary } from "@agent-replay/shared";

const base = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${base}${path}`, init);
  if (!response.ok) throw new Error((await response.json()).error ?? `Request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export const api = {
  listRuns: () => request<RunSummary[]>("/api/runs"),
  getRun: (id: string) => request<RunDetail>(`/api/runs/${id}`),
  diagnose: (id: string) => request<Diagnosis>(`/api/runs/${id}/diagnose`, { method: "POST" }),
  compare: (baseline: string, target: string) => request<Comparison>(`/api/compare?baseline=${baseline}&target=${target}`),
  replayUrl: (id: string) => `${base}/api/runs/${id}/replay?speed=8`,
};
