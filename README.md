 Corbits x Secret Network

A proof of concept integrating [Secret Network](https://scrt.network) confidential AI inference with [Corbits](https://corbits.dev) / [Faremeter](https://faremeter.xyz) x402 agentic payments.

Agents pay **$0.01 USDC on Solana** per inference request. Payment is verified on-chain by the Corbits facilitator before the request reaches Secret AI. The full stack runs inside an Intel TDX Trusted Execution Environment — payment enforcement, inference, and TLS all attested by hardware.

---

## What's in this repo

```
apps/
  secret-ai-gateway/   ← x402 payment gateway (the product)
  chat-demo/           ← browser chat UI with Phantom wallet (the demo)
  client-test/         ← CLI test client
docker-compose.yaml              ← gateway SecretVM workload
apps/chat-demo/docker-compose.yaml  ← chat demo SecretVM workload
```

Two independent services. Two Docker images. Two SecretVM deployments.

---

## secret-ai-gateway

A [Faremeter](https://faremeter.xyz) x402 payment gateway built with Hono/TypeScript. Sits in front of Secret Network's confidential AI inference service and enforces on-chain USDC payment before proxying any request.

### How it works

```
Agent → POST /v1/chat/completions
  → 402 Payment Required (USDC terms, Solana mainnet, $0.01)
  → Agent pays via any Faremeter-compatible client
  → facilitator.corbits.dev verifies payment on-chain
  → Gateway proxies request to SecretAI with Bearer auth
  → llama3.3:70b responds (SSE streaming supported)
  → USDC settles on Solana to receiving wallet
```

### Live endpoint

Listed on the Corbits marketplace:
```
https://my-test-proxy.garbonzo.api.corbits.dev
```

Discoverable via the Corbits skill in Claude Code:
```
/corbits search secret
```

### Calling it (4 lines)

```typescript
import { payer } from "@faremeter/rides";
await payer.addLocalWallet(process.env.SOLANA_KEYPAIR_PATH);
const res = await payer.fetch("https://my-test-proxy.garbonzo.api.corbits.dev/v1/chat/completions", {
  method: "POST",
  body: JSON.stringify({ model: "llama3.3:70b", messages: [{ role: "user", content: "hello" }] })
});
```

### Verify the payment wall

```bash
curl -X POST https://my-test-proxy.garbonzo.api.corbits.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3.3:70b","messages":[{"role":"user","content":"hello"}]}'
```

Returns a `402` with the full x402 payload — scheme, network, price, wallet address, and a live blockhash from `facilitator.corbits.dev`.

### Environment variables

| Variable | Description |
|---|---|
| `SECRETAI_BASE_URL` | Secret AI upstream URL (e.g. `https://secretai-rytn.scrtlabs.com:21434`) |
| `SECRET_AI_API_KEY` | API key from [aidev.scrtlabs.com](https://aidev.scrtlabs.com/) |
| `PAYMENT_RECEIVE_ADDRESS` | Solana wallet address to receive USDC |
| `PORT` | Server port (default: `21434`) |

### Deploy to SecretVM

1. Push to `main` — GitHub Actions builds and pushes `ghcr.io/mrgarbonzo/corbitsxsecret:latest`
2. Make the GHCR package public
3. Create a SecretVM pointing at `docker-compose.yaml` in this repo
4. Inject the four env vars above as encrypted secrets
5. Enable HTTPS toggle in the SecretVM UI

TLS is auto-provisioned by SecretVM via ZeroSSL. The container listens on port `21434` — SecretVM handles TLS termination at the platform level.

---

## chat-demo

A browser-based chat interface that demonstrates paying for Secret AI inference via x402. Connects a Phantom wallet, pays per message automatically, and streams responses in real time. Shows live TDX attestation data from the inference VM — MRTD, RTMR1, RTMR3, and TLS certificate fingerprint.

### How it works

```
Browser (Phantom connected)
  → user sends message
  → Express backend proxies to CORBITS_API_URL via @faremeter/rides
  → gets 402 → browser builds USDC TransferChecked tx → Phantom signs
  → Corbits facilitator verifies → Secret AI responds → SSE stream
  → Phantom balance updates, attestation badge shown on each message
```

### Environment variables

| Variable | Description |
|---|---|
| `TARGET_URL` | Corbits endpoint URL (swappable for any x402-compatible endpoint) |
| `INFERENCE_VM_ATTEST_URL` | SecretVM attestation endpoint (e.g. `https://peach-camel.vm.scrtlabs.com:29343/self-attestation`) |
| `PORT` | Server port (default: `3000`) |

### Deploy to SecretVM

1. Push to `main` — GitHub Actions builds and pushes `ghcr.io/mrgarbonzo/corbitsxsecret-chat-demo:latest`
2. Make the GHCR package public
3. Create a SecretVM pointing at `apps/chat-demo/docker-compose.yaml`
4. Inject env vars as encrypted secrets
5. Enable HTTPS toggle

---

## Attestation

Every SecretVM exposes a live TDX attestation report. Key fields:

| Field | What it proves |
|---|---|
| `MRTD` | Firmware hash — the TEE itself is genuine Intel TDX |
| `RTMR1` | Linux kernel hash — the OS hasn't been tampered with |
| `RTMR3` | Root filesystem + `docker-compose.yaml` hash — exactly what code is running |
| `reportdata` | TLS certificate fingerprint — this connection goes to the attested VM |

**RTMR3 is the key field.** If it matches the expected value, the code running in the TEE is exactly what was deployed. No operator — including Secret Labs — can modify it without breaking the attestation.

Check the live attestation:
```bash
curl https://<your-secretvm-url>:29343/self-attestation
```

---

## CI/CD

GitHub Actions builds both images on every push to `main`:

| Job | Image |
|---|---|
| `build-gateway` | `ghcr.io/mrgarbonzo/corbitsxsecret:latest` |
| `build-chat-demo` | `ghcr.io/mrgarbonzo/corbitsxsecret-chat-demo:latest` |

Each image is also tagged with the git SHA for pinned deployments.

---

## Development

```bash
git clone https://github.com/MrGarbonzo/corbitsxsecret
cd corbitsxsecret
pnpm install
make         # lint + build
```

Requires pnpm v10.12.1+ and Node.js v20+.

```bash
# Run gateway locally
cp apps/secret-ai-gateway/.env.example apps/secret-ai-gateway/.env
# fill in env vars
pnpm -C apps/secret-ai-gateway start

# Run chat demo locally
cp apps/chat-demo/.env.example apps/chat-demo/.env
# fill in env vars
pnpm -C apps/chat-demo start
```

---

## Stack

- **Payment framework:** [Faremeter](https://faremeter.xyz) (`@faremeter/middleware`, `@faremeter/rides`)
- **Payment facilitator:** [facilitator.corbits.dev](https://facilitator.corbits.dev) (Corbits hosted)
- **Marketplace:** [Corbits](https://corbits.dev) — x402 agentic service registry
- **Inference:** [Secret AI](https://aidev.scrtlabs.com) — confidential AI on Secret Network
- **Compute:** [SecretVM](https://scrt.network) — Intel TDX trusted execution environments
- **Payment network:** Solana mainnet, USDC, exact x402 scheme
- **Gateway framework:** [Hono](https://hono.dev)
- **Language:** TypeScript, pnpm monorepo

---

## Related

- [Faremeter docs](https://docs.faremeter.xyz)
- [Corbits docs](https://docs.corbits.dev)
- [Secret AI SDK](https://docs.scrt.network/secret-network-documentation/secret-ai/sdk)
- [SecretVM attestation](https://docs.scrt.network/secret-network-documentation/secretvm-confidential-virtual-machines/attestation/what-is-attestation)
- [faremeter-ts-playground](https://github.com/faremeter/faremeter-ts-playground) — the monorepo this was built from
