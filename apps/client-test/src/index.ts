import "dotenv/config";
import { payer } from "@faremeter/rides";
import { configureApp, getLogger } from "@faremeter/logs";

await configureApp({ level: "debug" });
const logger = await getLogger(["client-test"]);

const privateKey = process.env["SOLANA_PRIVATE_KEY"];
if (!privateKey) {
  logger.fatal("SOLANA_PRIVATE_KEY is not set");
  process.exit(1);
}

await payer.addLocalWallet(privateKey);
logger.info("Wallet loaded");

const targetUrl =
  process.env["TARGET_URL"] ??
  "https://peach-camel.vm.scrtlabs.com/v1/chat/completions";
logger.info(`Fetching ${targetUrl}`);

try {
  const response = await payer.fetch(targetUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.3:70b",
      messages: [{ role: "user", content: "Say hello in one sentence." }],
    }),
  });
  const body = await response.text();

  logger.info("Response received", {
    status: response.status,
    statusText: response.statusText,
    bodyLength: body.length,
  });
  logger.debug("Response body", { body });
} catch (err: unknown) {
  const e = err as Error & { response?: Response };
  logger.fatal("Payment failed", { message: e.message });
  if (e.response) {
    const text = await e.response.text().catch(() => "(unreadable)");
    logger.fatal("Response details", {
      status: e.response.status,
      headers: Object.fromEntries(e.response.headers.entries()),
      body: text,
    });
  }
}
