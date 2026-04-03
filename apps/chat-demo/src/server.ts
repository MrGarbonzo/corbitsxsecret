import "dotenv/config";
import express from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { configureApp, getLogger } from "@faremeter/logs";

await configureApp({ level: "debug" });
const logger = await getLogger(["chat-demo"]);

const TARGET_URL = process.env["TARGET_URL"];
if (!TARGET_URL) {
  logger.error("TARGET_URL environment variable is required");
  process.exit(1);
}
const PORT = Number(process.env["PORT"] ?? "3000");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.json());

// --- Health check ---
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Solana RPC proxy (avoids browser CORS issues) ---
app.post("/rpc", async (req, res) => {
  try {
    const rpcUrl =
      process.env["SOLANA_RPC_URL"] ?? "https://api.mainnet-beta.solana.com";
    const upstream = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await upstream.text();
    res.setHeader("Content-Type", "application/json");
    res.send(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("RPC proxy error", { error: message });
    res.status(502).json({ error: message });
  }
});

// --- Corbits proxy ---
// Single POST endpoint. The frontend sends { url, method, headers, body }
// and we forward to Corbits, streaming the response back.
// This avoids upstream WAF rules that block common API path patterns.
interface ProxyRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

app.post("/gw", async (req, res) => {
  const { url, method, headers: reqHeaders, body } = req.body as ProxyRequest;
  if (!url) {
    res.status(400).json({ error: "url is required" });
    return;
  }

  const upstreamUrl = `${TARGET_URL}${url}`;
  const upstreamMethod = method ?? "POST";

  const headers = new Headers();
  if (reqHeaders) {
    for (const [key, value] of Object.entries(reqHeaders)) {
      headers.set(key, value);
    }
  }

  logger.info(`Proxy ${upstreamMethod} ${url}`, { upstream: upstreamUrl });

  try {
    const upstream = await fetch(upstreamUrl, {
      method: upstreamMethod,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    // Forward status and all response headers
    res.status(upstream.status);
    for (const [key, value] of upstream.headers.entries()) {
      if (!["transfer-encoding", "connection"].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    // Stream the body back
    if (!upstream.body) {
      res.end();
      return;
    }

    const reader = (upstream.body as ReadableStream<Uint8Array>).getReader();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Proxy error", { error: message });
    if (!res.headersSent) {
      res.status(502).json({ error: message });
    }
  }
});

app.listen(PORT, () => {
  logger.info(`Chat demo listening on http://localhost:${PORT}`);
});
