import { runStartupPipeline } from "@/lib/agents/pipeline";
import {
  consumeAnalysisQuota,
  consumeDeepScrapeQuota,
  extractUserKey,
  getQuotaSnapshot,
} from "@/lib/rate-limit";
import { AnalysisInputSchema, type AgentSSEEvent } from "@/lib/types";

export const maxDuration = 300;

export async function GET(req: Request) {
  const userKey = extractUserKey(req);
  return Response.json({ quota: getQuotaSnapshot(userKey) });
}

export async function POST(req: Request) {
  const userKey = extractUserKey(req);

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = AnalysisInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json(
      {
        error: parsed.error.issues[0]?.message || "Invalid input parameters.",
      },
      { status: 400 }
    );
  }

  const quotaCheck = consumeAnalysisQuota(userKey);
  if (!quotaCheck.allowed) {
    return Response.json(
      {
        error: `Daily limit reached (${quotaCheck.quota.analysesLimit} live analyses per ${quotaCheck.quota.resetWindowHours}h). You can still explore saved reports or instant demo presets!`,
        quota: quotaCheck.quota,
      },
      { status: 429 }
    );
  }

  const allowDeepScrape = parsed.data.enableDeepScrape
    ? consumeDeepScrapeQuota(userKey)
    : false;
  const updatedQuota = getQuotaSnapshot(userKey);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AgentSSEEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // Stream closed by client
        }
      };

      send({ type: "quota", quota: updatedQuota });

      try {
        const report = await runStartupPipeline({
          input: parsed.data,
          allowDeepScrape,
          emit: send,
        });

        send({
          type: "complete",
          report,
          quota: getQuotaSnapshot(userKey),
        });
      } catch (err) {
        send({
          type: "error",
          message:
            err instanceof Error
              ? err.message
              : "Unexpected error running startup agents.",
          quota: getQuotaSnapshot(userKey),
        });
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
