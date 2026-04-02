import "dotenv/config";
import express from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { configureApp, getLogger } from "@faremeter/logs";

await configureApp({ level: "debug" });
const logger = await getLogger(["chat-demo"]);

const TARGET_URL =
  process.env["TARGET_URL"] ?? "https://my-test-proxy.garbonzo.api.corbits.dev";
const PORT = Number(process.env["PORT"] ?? "3000");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.static(path.join(__dirname, "..", "public")));

// --- Proxy to Corbits endpoint ---
// Forwards all headers (including x402 payment headers) and streams the response.
// This avoids CORS issues — the browser talks to our backend, which talks to Corbits.
app.all("/proxy/{*path}", async (req, res) => {
  const upstreamPath = req.params.path;
  const upstreamUrl = `${TARGET_URL}/${upstreamPath}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (
      typeof value === "string" &&
      !["host", "connection"].includes(key.toLowerCase())
    ) {
      headers.set(key, value);
    }
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const bodyChunks: Buffer[] = [];

  if (hasBody) {
    await new Promise<void>((resolve) => {
      req.on("data", (chunk: Buffer) => bodyChunks.push(chunk));
      req.on("end", resolve);
    });
  }

  logger.info(`Proxy ${req.method} /${upstreamPath}`, {
    upstream: upstreamUrl,
  });

  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      ...(hasBody ? { body: Buffer.concat(bodyChunks) } : {}),
    });

    // Forward status and all headers back to the client
    res.status(upstream.status);
    for (const [key, value] of upstream.headers.entries()) {
      if (!["transfer-encoding", "connection"].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    // Stream the body
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
