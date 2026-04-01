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

const targetUrl = process.env["TARGET_URL"] ?? "https://helius.api.corbits.dev";
logger.info(`Fetching ${targetUrl}`);

const response = await payer.fetch(targetUrl);
const body = await response.text();

logger.info("Response received", {
  status: response.status,
  statusText: response.statusText,
  bodyLength: body.length,
});
logger.debug("Response body", { body });
