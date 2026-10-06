import { GoogleGenAI } from "@google/genai";
import { diagnosisSchema, type Diagnosis, type RunDetail } from "@agent-replay/shared";
import { z } from "zod";
import { config } from "./config.js";

export async function diagnoseRun(run: RunDetail): Promise<Diagnosis> {
  if (!config.geminiApiKey) throw new Error("GEMINI_API_KEY is required for AI diagnosis");
  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  const compactEvents = run.events.map(({ input, output, metadata, ...event }) => ({
    ...event,
    input: JSON.stringify(input).slice(0, 1500),
    output: JSON.stringify(output).slice(0, 1500),
    metadata,
  }));
  const response = await ai.models.generateContent({
    model: config.geminiModel,
    contents: `You are a senior AI reliability engineer. Diagnose this failed agent run.
Base every claim on supplied events, distinguish root cause from symptoms, and identify
the exact first causal event.\n\n${JSON.stringify({ ...run, events: compactEvents })}`,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(diagnosisSchema),
      temperature: 0.1,
    },
  });
  return diagnosisSchema.parse(JSON.parse(response.text ?? "{}"));
}
