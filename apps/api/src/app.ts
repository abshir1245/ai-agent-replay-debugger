import cors from "@fastify/cors";
import { createRunSchema } from "@agent-replay/shared";
import Fastify from "fastify";
import { config } from "./config.js";
import { diagnoseRun } from "./diagnose.js";
import { compareEventStreams, replay } from "./replay.js";
import { getRun, insertRun, listRuns, saveDiagnosis } from "./repository.js";

export async function buildApp() {
  const app = Fastify({ logger: true, bodyLimit: 5_000_000 });
  await app.register(cors, { origin: config.webOrigin });

  app.get("/health", async () => ({ status: "ok" }));
  app.get<{ Querystring: { status?: string } }>("/api/runs", async (request) => listRuns(request.query.status));
  app.get<{ Params: { id: string } }>("/api/runs/:id", async (request, reply) => {
    const run = await getRun(request.params.id);
    return run ?? reply.code(404).send({ error: "Run not found" });
  });
  app.post("/api/runs", async (request, reply) => {
    const parsed = createRunSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid run", details: parsed.error.issues });
    const id = await insertRun(parsed.data);
    return reply.code(201).send({ id });
  });
  app.post<{ Params: { id: string } }>("/api/runs/:id/diagnose", async (request, reply) => {
    const run = await getRun(request.params.id);
    if (!run) return reply.code(404).send({ error: "Run not found" });
    if (!config.geminiApiKey) {
      return reply.code(503).send({
        error: "AI diagnosis is not configured. Add GEMINI_API_KEY to .env and restart the app.",
      });
    }
    try {
      const diagnosis = await diagnoseRun(run);
      await saveDiagnosis(run.id, config.geminiModel, diagnosis);
      return diagnosis;
    } catch (error) {
      request.log.error({ error }, "Gemini diagnosis failed");
      return reply.code(502).send({
        error: "Gemini could not generate a diagnosis. Check the API key, model access, and server log.",
      });
    }
  });
  app.get<{ Params: { id: string }; Querystring: { speed?: string } }>(
    "/api/runs/:id/replay",
    async (request, reply) => {
      const run = await getRun(request.params.id);
      if (!run) return reply.code(404).send({ error: "Run not found" });
      reply.raw.setHeader("Content-Type", "text/event-stream");
      reply.raw.setHeader("Cache-Control", "no-cache");
      for await (const event of replay(run.events, Number(request.query.speed ?? 4))) {
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      }
      reply.raw.end();
    },
  );
  app.get<{ Querystring: { baseline: string; target: string } }>("/api/compare", async (request, reply) => {
    const [baseline, target] = await Promise.all([getRun(request.query.baseline), getRun(request.query.target)]);
    if (!baseline || !target) return reply.code(404).send({ error: "One or both runs were not found" });
    return compareEventStreams(baseline.id, target.id, baseline.events, target.events);
  });
  return app;
}
