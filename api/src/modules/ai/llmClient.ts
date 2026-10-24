import { z } from "zod";

// Gemini API (serves Gemma) REST client. The key is read per call from
// process.env and only ever sent as the x-goog-api-key header: never put it
// in a URL, an error, a log line or a GraphQL response.

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 30_000;
const RETRIES = 1;

export type LlmErrorCode = "not_configured" | "timeout" | "unavailable" | "rejected" | "bad_response";

// Messages are fixed strings so nothing from the request or upstream body
// (which could echo credentials) reaches callers.
const MESSAGES: Record<LlmErrorCode, string> = {
  not_configured: "AI түлхүүр тохируулаагүй",
  timeout: "AI хариу хугацаандаа ирсэнгүй",
  unavailable: "AI үйлчилгээ түр ажиллахгүй байна",
  rejected: "AI хүсэлтийг хүлээж авсангүй",
  bad_response: "AI хариу буруу бүтэцтэй ирлээ",
};

export class LlmError extends Error {
  constructor(public readonly code: LlmErrorCode) {
    super(MESSAGES[code]);
    this.name = "LlmError";
  }
}

const responseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({
          parts: z.array(z.object({ text: z.string().optional(), thought: z.boolean().optional() })),
        }),
      }),
    )
    .min(1),
});

const readConfig = () => {
  const apiKey = process.env.EDUTUTOR_LLM_API_KEY;
  const model = process.env.EDUTUTOR_LLM_MODEL;

  return apiKey && model ? { apiKey, model } : null;
};

export const isLlmConfigured = () => readConfig() !== null;

// Network trouble and unparseable text are worth one more try; a rejected
// request (bad key, unsupported option) is not.
const isRetryable = (error: unknown) =>
  error instanceof LlmError &&
  (error.code === "timeout" || error.code === "unavailable" || error.code === "bad_response");

const requestText = async (prompt: string, apiKey: string, model: string) => {
  let response: Response;

  try {
    response = await fetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        // Gemma 4 thinks for ~40s by default; minimal keeps a batch inside
        // the timeout. JSON mode is not used: the text is parsed below.
        generationConfig: { temperature: 0.7, thinkingConfig: { thinkingLevel: "minimal" } },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new LlmError(
      error instanceof Error && error.name === "TimeoutError" ? "timeout" : "unavailable",
    );
  }

  if (response.status === 429 || response.status >= 500) throw new LlmError("unavailable");
  if (!response.ok) throw new LlmError("rejected");

  const parsed = responseSchema.safeParse(await response.json().catch(() => null));

  if (!parsed.success) throw new LlmError("bad_response");

  // Thought parts carry the model's reasoning, not the answer.
  return (parsed.data.candidates[0]?.content.parts ?? [])
    .filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("");
};

// Models wrap JSON in ``` fences or add a sentence around it; take the
// outermost object.
const extractJson = (text: string): unknown => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end <= start) return null;

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
};

export const generateJson = async <T>(prompt: string, schema: z.ZodType<T>): Promise<T> => {
  const config = readConfig();

  if (!config) throw new LlmError("not_configured");

  for (let attempt = 0; ; attempt++) {
    try {
      const result = schema.safeParse(
        extractJson(await requestText(prompt, config.apiKey, config.model)),
      );

      if (!result.success) throw new LlmError("bad_response");

      return result.data;
    } catch (error) {
      if (attempt >= RETRIES || !isRetryable(error)) {
        throw error instanceof LlmError ? error : new LlmError("unavailable");
      }
    }
  }
};
