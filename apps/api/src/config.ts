import "dotenv/config";

export const config = {
  databaseUrl: process.env.DATABASE_URL ?? "postgres://agent_replay:agent_replay@localhost:5432/agent_replay",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  port: Number(process.env.API_PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
};
