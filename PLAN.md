# Corbits x Secret Network — Integration Plan

**Last updated:** 2026-04-01
**Owner:** Garbonzo
**Repo:** https://github.com/MrGarbonzo/corbitsxsecret

---

## Phase Tracker

| Phase | Description                                          | Status      |
| ----- | ---------------------------------------------------- | ----------- |
| 1     | Playground: env verify + client test + gateway build | ✅ Complete |
| 2     | GHCR image + SecretVM running + HTTPS                | ✅ Complete |
| 2.5   | Full end-to-end paid inference test                  | ✅ Complete |
| 3     | Registered on Corbits marketplace                    | ✅ Complete |
| 4     | Chat demo — build                                    | ✅ Complete |
| 4.5   | Chat demo — push + deploy to SecretVM                | 🟡 Next     |
| 5     | Hand off gateway to Secret Labs for production       | ⬜ Pending  |
| 6     | Get `scrt.api.corbits.dev` from Pontus               | ⬜ Pending  |
| 7     | Flex implementation                                  | ⬜ Blocked  |
| 8     | Self-funding agent demo                              | ⬜ Future   |
| 9     | TEE facilitator pitch                                | ⬜ Future   |

---

## What's Live Now

| Item                    | Value                                                |
| ----------------------- | ---------------------------------------------------- |
| Corbits marketplace URL | `https://my-test-proxy.garbonzo.api.corbits.dev` ✅  |
| Gateway demo VM         | `https://peach-camel.vm.scrtlabs.com` ✅             |
| GHCR image (gateway)    | `ghcr.io/mrgarbonzo/corbitsxsecret:latest`           |
| GHCR image (chat demo)  | `ghcr.io/mrgarbonzo/corbitsxsecret-chat-demo:latest` |
| Repo                    | `github.com/MrGarbonzo/corbitsxsecret`               |
| E2E test                | ✅ 3.37 → 3.36 USDC, llama3.3:70b responded          |

---

## Repo Structure

```
MrGarbonzo/corbitsxsecret
├── apps/
│   ├── secret-ai-gateway/      ← Faremeter x402 middleware gateway (deployed)
│   │   ├── src/index.ts
│   │   └── Dockerfile
│   ├── chat-demo/              ← Browser chat UI ✅ built, pending deploy
│   │   ├── src/server.ts       ← Express: /health, /rpc (Solana proxy), /gw (Corbits proxy)
│   │   ├── public/index.html   ← Single file: Phantom connect, x402 pay, SSE stream
│   │   ├── Dockerfile
│   │   └── docker-compose.yaml ← chat demo SecretVM workload
│   └── client-test/            ← CLI test client
├── docker-compose.yaml             ← gateway SecretVM workload
├── .github/workflows/
│   └── docker-publish.yml      ← builds BOTH images on push to main
└── NOTES.md / PLAN.md
```

---

## Phase 4 — Chat Demo Architecture (CONFIRMED)

### Key finding: Phantom pays directly — no server-side wallet needed

The browser builds and signs the x402 Solana transaction using Phantom. No
`SOLANA_PRIVATE_KEY` env var required. This is cleaner and more authentic for a demo.

```
Browser (Phantom connected)
  → user sends message
  → /gw proxy on Express backend (forwards to TARGET_URL)
  → gets 402 back
  → browser builds USDC TransferChecked transaction
  → Phantom signs it
  → browser retries with X-PAYMENT or PAYMENT-SIGNATURE header
  → Corbits facilitator verifies on-chain
  → Secret AI responds (SSE stream)
  → response piped back through /gw to browser token by token
  → Phantom balance refreshes automatically
```

### Backend routes (Express)

- `GET /health` — 200 + `{"status":"ok","timestamp":"..."}` — no auth
- `POST /rpc` — proxies Solana mainnet RPC calls (avoids browser CORS issues)
- `POST /gw` — accepts `{url, method, headers, body}`, forwards to `TARGET_URL`,
  streams response back. Handles both 402 and 200.

### Frontend (single index.html, no build step)

- Phantom connect → shows address + USDC balance
- x402 flow: 402 → parse requirements → build TransferChecked tx → Phantom signs
  → retry with payment header
- Both x402 v1 and v2 handled
- SSE streaming: tokens appear as they arrive
- Balance refreshes 2s after each payment
- Dark theme, minimal, tech demo aesthetic

### Env vars (chat demo)

```
TARGET_URL=https://my-test-proxy.garbonzo.api.corbits.dev
PORT=3000
```

No wallet key needed. Phantom is the payer.

### docker-compose.yaml (apps/chat-demo/docker-compose.yaml)

```yaml
services:
  chat-demo:
    image: ghcr.io/mrgarbonzo/corbitsxsecret-chat-demo:latest
    ports:
      - "3000:3000"
    environment:
      - TARGET_URL
      - PORT=3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Deploy steps (Phase 4.5)

1. `git add . && git commit -m "feat: chat demo" && git push origin main`
2. GitHub Actions builds both images — watch for green on `build-chat-demo` job
3. Verify image at `github.com/MrGarbonzo/corbitsxsecret/pkgs/container/corbitsxsecret-chat-demo`
4. Make package public: GitHub → Packages → corbitsxsecret-chat-demo → Package settings → Public
5. Create new SecretVM pointing at `apps/chat-demo/docker-compose.yaml`
6. Inject env vars: `TARGET_URL`, `PORT=3000`
7. Enable HTTPS toggle in SecretVM UI
8. Note the `*.vm.scrtlabs.com` URL
9. Smoke test: `/health` → 200, connect Phantom, send a message

---

## Gateway — Production Handoff (Phase 5)

Secret Labs needs to:

1. Deploy `ghcr.io/mrgarbonzo/corbitsxsecret:latest` on Secret Labs infra
2. Point permanent domain at it
3. Inject: `SECRETAI_BASE_URL`, `SECRET_AI_API_KEY`, `PAYMENT_RECEIVE_ADDRESS`,
   `PORT=21434`
4. Give Pontus the URL → registers under `scrt.api.corbits.dev`

`peach-camel` demo VM can be shut down after handoff.

---

## Flex (Phase 7 — BLOCKED)

`facilitator.corbits.dev/supported` — only `exact` scheme as of 2026-03-31.
Need Pontus to provide the Flex preview facilitator URL.

---

## Key Decisions — All Phases

| Decision                  | Answer                                               |
| ------------------------- | ---------------------------------------------------- |
| Corbits registration      | Self-service on website, Path A proxy                |
| Active Corbits endpoint   | `my-test-proxy.garbonzo.api.corbits.dev`             |
| Gateway image             | `ghcr.io/mrgarbonzo/corbitsxsecret:latest`           |
| Chat demo image           | `ghcr.io/mrgarbonzo/corbitsxsecret-chat-demo:latest` |
| Gateway port              | 21434:21434, SecretVM handles TLS                    |
| Chat demo port            | 3000:3000, SecretVM handles TLS                      |
| TLS (both)                | SecretVM toggle, ZeroSSL, container never sees 443   |
| Payment network           | solana-mainnet-beta, exact scheme                    |
| Gateway receiving wallet  | `7DEYurQYP68WUxSkSzByCi7DXtokpzbZi9VxqKZJVwvU`       |
| Chat demo payer           | User's Phantom wallet — no server-side key           |
| Chat demo API URL env var | `TARGET_URL` (swappable for any x402 endpoint)       |
| Model                     | Configured in Corbits proxy, not in chat demo        |
| Flex                      | Blocked — not on facilitator yet                     |

---

## Action Items

### Garbonzo (immediate)

- [ ] `git add . && git commit && git push` — triggers both image builds
- [ ] Make `corbitsxsecret-chat-demo` package public on GHCR
- [ ] Create new SecretVM for chat demo
- [ ] Inject env vars, enable HTTPS toggle
- [ ] Test: connect Phantom, send a message, verify payment + response

### Garbonzo (ongoing)

- [ ] Give Alex instructions to test Corbits endpoint
- [ ] Message Pontus: get `scrt.api.corbits.dev` + ask Flex facilitator URL
- [ ] Join Flex preview: https://t.me/+yRlfSOV65vxhNzEx
- [ ] Hand off gateway to Secret Labs

### Secret Labs

- [ ] Deploy gateway on permanent infrastructure
- [ ] Provide URL to Pontus for `scrt.api.corbits.dev`

### Pontus / ABK

- [ ] Set up `scrt.api.corbits.dev`
- [ ] Provide Flex preview facilitator endpoint
- [ ] Float agent template to Crossmint
