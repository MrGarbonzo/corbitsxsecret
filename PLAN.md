# Corbits x Secret Network — Integration Plan

**Last updated:** 2026-04-01  
**Owner:** Garbonzo  
**Status:** ✅ DEMO COMPLETE — ready to hand off to Secret Labs

---

## The Asks (full picture, post-Telegram)

1. **Register Secret services on Corbits marketplace** — handoff to Secret Labs ✅ demo ready
2. **Implement Flex** — blocked on facilitator, flag to Pontus
3. **Agent template** — Pontus → Crossmint, pending
4. **Define the self-funding agent narrative** — future phase

---

## Phase Tracker

| Phase | Description                                              | Status           |
| ----- | -------------------------------------------------------- | ---------------- |
| 1     | Playground: env verify + client test + gateway build     | ✅ Complete      |
| 2     | GHCR image + SecretVM running + HTTPS                    | ✅ Complete      |
| 2.5   | Full end-to-end paid inference test                      | ✅ Complete      |
| 3     | Hand off to Secret Labs for production deploy            | 🟡 Next          |
| 3.5   | Register on Corbits marketplace (`scrt.api.corbits.dev`) | ⬜ After handoff |
| 4     | Flex implementation                                      | ⬜ Blocked       |
| 5     | Self-funding agent demo                                  | ⬜ Future        |
| 6     | TEE facilitator pitch                                    | ⬜ Future        |

---

## Full End-to-End Test — ✅ VERIFIED (2026-04-01)

**What happened:**

1. Client sent POST to `https://peach-camel.vm.scrtlabs.com/v1/chat/completions`
2. Gateway returned 402 with USDC payment requirements
3. Faremeter client auto-paid $0.01 USDC on Solana mainnet
4. `facilitator.corbits.dev` verified the payment
5. Gateway proxied request to SecretAI (`llama3.3:70b`)
6. SecretAI responded: _"Hello, it's nice to meet you and I'm here to help with any questions or topics you'd like to discuss!"_

**Paid, private AI inference through a TDX-attested SecretVM, gated by x402 micropayments. Full loop confirmed.**

---

## Demo Deployment (for handoff)

| Item          | Value                                                        |
| ------------- | ------------------------------------------------------------ |
| Live endpoint | `https://peach-camel.vm.scrtlabs.com`                        |
| Repo          | `github.com/MrGarbonzo/corbitsxsecret`                       |
| GHCR image    | `ghcr.io/mrgarbonzo/corbitsxsecret:latest`                   |
| TLS           | ZeroSSL, auto-provisioned by SecretVM, terminates inside TEE |
| Payment       | $0.01 USDC, solana-mainnet-beta, exact scheme                |
| Wallet        | `7DEYurQYP68WUxSkSzByCi7DXtokpzbZi9VxqKZJVwvU` (demo)        |
| Model         | `llama3.3:70b` via SecretAI                                  |

---

## What Secret Labs Needs to Do (production handoff)

1. Deploy `ghcr.io/mrgarbonzo/corbitsxsecret:latest` on Secret Labs infrastructure
2. Point a permanent domain at it
3. Inject four env vars at boot:
   - `SECRETAI_BASE_URL=https://secretai-rytn.scrtlabs.com:21434`
   - `SECRET_AI_API_KEY=<production key>`
   - `PAYMENT_RECEIVE_ADDRESS=<Secret Labs Solana wallet>`
   - `PORT=21434`
4. Provide permanent URL to Pontus (ABK) → registers under `scrt.api.corbits.dev`

Demo deployment can be shut down once Secret Labs takes over.

---

## What Pontus Needs (after Secret Labs deploys)

- Production HTTPS URL → he sets up `scrt.api.corbits.dev`
- Answer on Flex preview facilitator URL

---

## PHASE 4 — Flex (BLOCKED)

`facilitator.corbits.dev/supported` — only `exact` scheme. Need Pontus to provide preview facilitator URL.

---

## Key Decisions Locked

| Decision    | Answer                                        |
| ----------- | --------------------------------------------- |
| Framework   | Faremeter `@faremeter/middleware/hono`        |
| Payment     | $0.01 USDC, solana-mainnet-beta, exact scheme |
| Facilitator | `facilitator.corbits.dev` (Corbits hosted)    |
| TLS         | SecretVM auto-provisioned ZeroSSL, inside TEE |
| Deployment  | Docker, GHCR, docker-compose.yaml, no SSH     |
| Flex        | Blocked — not on facilitator yet              |

---

## The One-Liners

**What was built:** "A Faremeter x402 payment wall in front of Secret AI, running inside a TDX-attested SecretVM. Agents pay $0.01 USDC on Solana, get private inference back. Full loop verified."

**The bigger story:** "A self-sovereign AI agent in a TEE that earns its own income and spends it autonomously — cryptographic proof no human controls the wallet or the logic."
