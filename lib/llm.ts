import { z } from "zod";

const GEMINI_MODEL = "gemini-2.5-flash";
const GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-20b",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const invalidGeminiCache = new Map<string, { message: string; until: number }>();
const groqCooldownUntil = new Map<string, number>();
let groqPoolCache: { apiKey: string; models: string[]; until: number } | null = null;
let groqCursor = 0;

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

function parseApiError(status: number, errText: string): string {
  try {
    const parsed = JSON.parse(errText) as { error?: { message?: string } };
    if (parsed.error?.message) {
      return `HTTP ${status}: ${parsed.error.message}`;
    }
  } catch {
    // Non-JSON error body
  }
  return `HTTP ${status}${errText ? `: ${errText.slice(0, 120)}` : ""}`;
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  jsonMode: boolean
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const cachedInvalid = invalidGeminiCache.get(apiKey);
  if (cachedInvalid && Date.now() < cachedInvalid.until) {
    throw new Error(cachedInvalid.message);
  }

  // Google AQ.* keys may belong to Vertex AI Express Mode or AI Studio.
  const aiStudioUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const vertexExpressUrl = `https://aiplatform.googleapis.com/v1/publishers/google/models/${GEMINI_MODEL}:generateContent`;
  const endpoints = apiKey.startsWith("AQ.")
    ? [vertexExpressUrl, aiStudioUrl]
    : [aiStudioUrl];

  const body: Record<string, unknown> = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.35,
      ...(jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };

  let lastError = "Gemini request failed";

  for (const endpoint of endpoints) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(35000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      lastError = `Gemini ${parseApiError(res.status, errText)}`;
      if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404) {
        continue;
      }
      throw new Error(lastError);
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Gemini returned empty response");
    }
    return text;
  }

  if (lastError.includes("API key not valid") || lastError.includes("HTTP 401")) {
    invalidGeminiCache.set(apiKey, {
      message: lastError,
      until: Date.now() + 2 * 60 * 1000,
    });
  }

  throw new Error(lastError);
}

function parseRetryDelayMs(errText: string, retryAfterHeader: string | null): number {
  const secMatch = errText.match(/try again in\s*([\d.]+)s/i);
  if (secMatch?.[1]) {
    return Math.min(Math.max(Math.ceil(parseFloat(secMatch[1]) * 1000) + 350, 800), 12000);
  }
  const msMatch = errText.match(/try again in\s*([\d.]+)ms/i);
  if (msMatch?.[1]) {
    return Math.min(Math.max(Math.ceil(parseFloat(msMatch[1])) + 350, 800), 12000);
  }
  if (retryAfterHeader) {
    const sec = Number(retryAfterHeader);
    if (Number.isFinite(sec) && sec > 0) {
      return Math.min(Math.max(Math.ceil(sec * 1000) + 350, 800), 12000);
    }
  }
  return 3500;
}

async function postGroqCompletion(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  jsonMode: boolean
): Promise<
  | { ok: true; text: string }
  | { ok: false; status: number; errText: string; retryAfterHeader: string | null }
> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_tokens: 1800,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return {
      ok: false,
      status: res.status,
      errText,
      retryAfterHeader: res.headers.get("retry-after"),
    };
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    return {
      ok: false,
      status: 500,
      errText: "Groq returned empty response",
      retryAfterHeader: null,
    };
  }
  return { ok: true, text };
}

async function getGroqModelPool(apiKey: string): Promise<string[]> {
  if (groqPoolCache && groqPoolCache.apiKey === apiKey && Date.now() < groqPoolCache.until) {
    return groqPoolCache.models;
  }

  const discovered = await discoverGroqModels(apiKey);
  const merged = Array.from(new Set([...GROQ_MODELS, ...discovered]));
  groqPoolCache = {
    apiKey,
    models: merged,
    until: Date.now() + 5 * 60 * 1000,
  };
  return merged;
}

async function discoverGroqModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: Array<{ id: string }> };
    return (data.data ?? [])
      .map((m) => m.id)
      .filter(
        (id) =>
          !id.includes("whisper") &&
          !id.includes("guard") &&
          !id.includes("tts") &&
          !id.includes("safeguard") &&
          !id.includes("compound")
      );
  } catch {
    return [];
  }
}

async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  jsonMode: boolean
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const pool = await getGroqModelPool(apiKey);
  const deadModels = new Set<string>();
  let lastError = "Groq request failed";

  for (let round = 0; round < 4; round++) {
    const now = Date.now();
    const candidates = pool.filter(
      (m) => !deadModels.has(m) && (groqCooldownUntil.get(m) ?? 0) <= now
    );

    if (candidates.length === 0) {
      const aliveCooldowns = pool
        .filter((m) => !deadModels.has(m))
        .map((m) => (groqCooldownUntil.get(m) ?? 0) - Date.now())
        .filter((ms) => ms > 0);
      if (aliveCooldowns.length === 0) break;
      const waitMs = Math.min(Math.min(...aliveCooldowns), 10000);
      await sleep(waitMs);
      continue;
    }

    // Spread concurrent agents across distinct Groq models.
    const start = groqCursor++ % candidates.length;
    const ordered = [
      ...candidates.slice(start),
      ...candidates.slice(0, start),
    ];

    for (const model of ordered) {
      if ((groqCooldownUntil.get(model) ?? 0) > Date.now()) continue;

      let result = await postGroqCompletion(
        apiKey,
        model,
        systemPrompt,
        userPrompt,
        jsonMode
      );
      if (!result.ok && jsonMode && result.status === 400) {
        result = await postGroqCompletion(
          apiKey,
          model,
          systemPrompt,
          userPrompt,
          false
        );
      }
      if (result.ok) return result.text;

      lastError = `Groq ${parseApiError(result.status, result.errText)}`;
      if (result.status === 429) {
        const waitMs = parseRetryDelayMs(result.errText, result.retryAfterHeader);
        groqCooldownUntil.set(model, Date.now() + waitMs);
        continue;
      }
      if (result.status === 404 || result.status === 400) {
        deadModels.add(model);
        continue;
      }
      throw new Error(lastError);
    }
  }

  throw new Error(lastError);
}

export async function generateStructuredJSON<T>(opts: {
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  schemaHint: string;
}): Promise<{ data: T; provider: "Gemini" | "Groq" }> {
  const fullSystem = `${opts.systemPrompt}

CRITICAL OUTPUT RULE:
Return ONLY valid JSON matching this exact shape (no markdown, no commentary):
${opts.schemaHint}`;

  const tryParse = (raw: string): T => {
    const jsonStr = extractJsonText(raw);
    const parsed = JSON.parse(jsonStr);
    return opts.schema.parse(parsed);
  };

  const formatErr = (e: unknown) => {
    if (e instanceof z.ZodError) {
      return e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    }
    return e instanceof Error ? e.message : String(e);
  };

  try {
    const raw = await callGemini(fullSystem, opts.userPrompt, true);
    return { data: tryParse(raw), provider: "Gemini" };
  } catch (geminiErr) {
    let lastGroqErr: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const raw = await callGroq(fullSystem, opts.userPrompt, true);
        return { data: tryParse(raw), provider: "Groq" };
      } catch (err) {
        lastGroqErr = err;
      }
    }
    throw new Error(
      `Both Gemini and Groq failed. Gemini: ${formatErr(geminiErr)} | Groq: ${formatErr(lastGroqErr)}`
    );
  }
}

export async function generateChatReply(opts: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<{ text: string; provider: "Gemini" | "Groq" }> {
  try {
    const text = await callGemini(opts.systemPrompt, opts.userPrompt, false);
    return { text, provider: "Gemini" };
  } catch (geminiErr) {
    try {
      const text = await callGroq(opts.systemPrompt, opts.userPrompt, false);
      return { text, provider: "Groq" };
    } catch (groqErr) {
      throw new Error(
        `Both Gemini and Groq failed. Gemini: ${
          geminiErr instanceof Error ? geminiErr.message : String(geminiErr)
        } | Groq: ${groqErr instanceof Error ? groqErr.message : String(groqErr)}`
      );
    }
  }
}

