import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { configureApp, getLogger } from "@faremeter/logs";

await configureApp({ level: "info" });
const logger = await getLogger(["secret-ai-gateway"]);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    logger.fatal(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

const SECRETAI_BASE_URL = requireEnv("SECRETAI_BASE_URL");
const SECRET_AI_API_KEY = requireEnv("SECRET_AI_API_KEY");
const PORT = Number(process.env["PORT"] ?? "21434");

const hopByHopHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

const app = new Hono();

// --- Health check (unprotected) ---
app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() }),
);

// --- Proxy handler ---
app.all("/v1/*", async (c) => proxy(c));
app.all("/api/*", async (c) => proxy(c));

async function proxy(c: {
  req: { raw: Request; url: string; method: string };
  body: (data: ReadableStream | string | null, init?: ResponseInit) => Response;
  header: (name: string, value: string) => void;
}): Promise<Response> {
  const incomingUrl = new URL(c.req.url);
  const upstreamUrl = `${SECRETAI_BASE_URL}${incomingUrl.pathname}${incomingUrl.search}`;

  const headers = new Headers();
  for (const [key, value] of c.req.raw.headers.entries()) {
    if (
      !hopByHopHeaders.has(key.toLowerCase()) &&
      key.toLowerCase() !== "host"
    ) {
      headers.set(key, value);
    }
  }
  headers.set("Authorization", `Bearer ${SECRET_AI_API_KEY}`);

  logger.info(`Proxying ${c.req.method} ${incomingUrl.pathname}`, {
    upstream: upstreamUrl,
  });

  const hasBody = c.req.method !== "GET" && c.req.method !== "HEAD";

  const upstreamResponse = await fetch(upstreamUrl, {
    method: c.req.method,
    headers,
    ...(hasBody ? { body: c.req.raw.body, duplex: "half" as const } : {}),
  });

  const isSSE =
    upstreamResponse.headers
      .get("content-type")
      ?.includes("text/event-stream") ?? false;

  const responseHeaders: Record<string, string> = {};
  for (const [key, value] of upstreamResponse.headers.entries()) {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      responseHeaders[key] = value;
    }
  }

  if (isSSE) {
    responseHeaders["Content-Type"] = "text/event-stream";
    responseHeaders["Cache-Control"] = "no-cache";
    responseHeaders["Connection"] = "keep-alive";
    responseHeaders["X-Accel-Buffering"] = "no";
  }

  return c.body(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

serve({ fetch: app.fetch, port: PORT }, () => {
  logger.info(`Gateway listening on port ${PORT}`);
});
