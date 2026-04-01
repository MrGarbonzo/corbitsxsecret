# Corbits x Secret Network — Partnership Research Notes

**Last updated:** 2026-04-01  
**Status:** ✅ DEMO COMPLETE — full end-to-end verified with on-chain payment proof

---

## 1. Corbits (`corbits.dev`)

**Tagline:** "Infrastructure for Agentic Commerce"  
**Twitter/X:** [@corbits_dev](https://x.com/corbits_dev)  
**GitHub:** [github.com/faremeter](https://github.com/faremeter)

### Core products

| Product         | Description                                                       |
| --------------- | ----------------------------------------------------------------- |
| **Discovery**   | `npx skills add corbits-infra/corbits-skill`                      |
| **Marketplace** | 70+ live services, real x402 payments                             |
| **Flex**        | Variable-cost escrow — invited to preview, NOT yet on facilitator |
| **Faremeter**   | Underlying open-source framework                                  |

### Secret Network subdomain

`scrt.api.corbits.dev` — confirmed by Pontus, set up after Secret Labs production deploy

---

## 2. Faremeter (`faremeter.xyz`)

**GitHub:** [github.com/faremeter/faremeter](https://github.com/faremeter/faremeter) — v0.17.1  
**License:** LGPL-3.0 | **Built by:** ABK Labs

### Hosted facilitator — `https://facilitator.corbits.dev`

Verified 2026-03-31 — only `exact` scheme present, Flex not yet deployed.

| Scheme | Networks                           | x402 Version |
| ------ | ---------------------------------- | ------------ |
| exact  | solana-mainnet-beta, solana-devnet | v1           |
| exact  | base, base-sepolia                 | v1           |
| exact  | monad, monad-testnet               | v1           |
| exact  | skale-base, skale-base-sepolia     | v1           |
| exact  | solana (CAIP-2)                    | v2           |
| exact  | eip155 chains (Base, Monad, SKALE) | v2           |

---

## 3. What Was Built

**Repo:** `https://github.com/MrGarbonzo/corbitsxsecret`  
**GHCR image:** `ghcr.io/mrgarbonzo/corbitsxsecret:latest`  
**Demo endpoint:** `https://peach-camel.vm.scrtlabs.com`

### Architecture

A Faremeter x402 payment gateway (`@faremeter/middleware/hono`) running as a single Docker container on a SecretVM (Intel TDX). Intercepts all `/v1/*` and `/api/*` requests, enforces $0.01 USDC payment on Solana mainnet via `facilitator.corbits.dev`, proxies verified requests to SecretAI with Bearer auth. SSE streaming passed through without buffering. `/health` unprotected.

### Request flow

```
Agent → POST /v1/chat/completions
  → 402 (USDC terms, solana-mainnet-beta, $0.01)
  → Agent pays via Faremeter client
  → facilitator.corbits.dev verifies on-chain
  → Gateway proxies to SECRETAI_BASE_URL with Bearer token
  → SecretAI (llama3.3:70b) responds
  → USDC settles on Solana to receiving wallet
```

### Full end-to-end demo — ✅ VERIFIED (2026-04-01)

```
1. HEALTH CHECK
   GET /health → 200 {"status":"ok","timestamp":"2026-04-01T05:22:41.019Z"}

2. PAYMENT WALL
   POST /v1/models (no payment) → HTTP 402

3. USDC BALANCE (pre-payment)
   Wallet: Cs8cX73EWAxKQ9iNUpqTZMv5bEfoiSNsHKVsgbz42gZZ
   Balance: 3.37 USDC

4. PAID INFERENCE
   Model:    llama3.3:70b
   Payment:  $0.01 USDC, solana-mainnet-beta, via Corbits facilitator
   Runtime:  SecretVM (Intel TDX attested)
   Response: "Hello, it's nice to meet you and I'm looking forward to chatting with you!"
   Status:   200 OK

5. USDC BALANCE (post-payment)
   Balance: 3.36 USDC — exactly $0.01 deducted on-chain
```

**$0.01 moved on Solana. Secret AI responded. Full loop proven.**

### Env vars (injected at boot, never in image)

```
SECRETAI_BASE_URL=https://secretai-rytn.scrtlabs.com:21434
SECRET_AI_API_KEY=<key>
PAYMENT_RECEIVE_ADDRESS=<solana wallet>
PORT=21434
```

### TLS

ZeroSSL cert auto-provisioned by SecretVM, valid to 2026-06-30, terminates inside TEE.

### Known cosmetic issues (non-blocking)

- `resource` in 402 shows `http://` — container sees plain HTTP internally, TLS at platform level. Payment flow unaffected.
- `accepts` array has duplicate entry — easy fix before production.

---

## 4. Secret AI SDK

**Upstream:** `https://secretai-rytn.scrtlabs.com:21434`  
**Protocol:** OpenAI-compatible, SSE streaming  
**Auth:** `Authorization: Bearer $SECRET_AI_API_KEY`  
**Dev portal:** https://aidev.scrtlabs.com/

---

## 5. Flex (`flex.faremeter.xyz`)

**Invited:** Yes — https://t.me/+yRlfSOV65vxhNzEx  
**On facilitator:** ❌ Not yet  
**Obligations:** GitHub feedback + implementation + GTM support  
**Next:** Ask Pontus for preview facilitator URL

---

## Meeting Notes — 2026-03-31

**Attendees:** Pope Black, Alex Zaidelson (SecretLabs), Garbonzo, Pontus Andersson (ABK)  
**Key confirms:** 70+ live services, Secret has x402 capability, narrative is the missing piece.  
**Tracks agreed:** Register SecretAI + SecretVM / Agent template / Faremeter PoC

---

## Telegram Context

- **3/27 Pontus:** Recommended `faremeter-ts-playground`
- **3/31 Pontus:** @benwachman_abk (DevRel), @alxndrguy (CTO). Flex invite. `scrt.api.corbits.dev` confirmed.

---

## People & Contacts

| Name             | Handle          | Role                | Contact            |
| ---------------- | --------------- | ------------------- | ------------------ |
| Pontus Andersson | —               | ABK Labs co-founder | pontus@abklabs.com |
| Ben Wachman      | @benwachman_abk | DevRel              | TBD                |
| Alex             | @alxndrguy      | CTO                 | TBD                |

---

## Open Questions

- [x] ~~Full e2e paid inference works?~~ → ✅ $0.01 USDC moved on-chain, Secret AI responded
- [x] ~~GHCR org?~~ → `ghcr.io/mrgarbonzo/corbitsxsecret`
- [x] ~~SecretVM running?~~ → ✅ `https://peach-camel.vm.scrtlabs.com`
- [x] ~~HTTPS/TLS?~~ → ✅ ZeroSSL inside TEE
- [ ] Flex preview facilitator URL — ask Pontus
- [ ] Fix duplicate `accepts` entry before production
- [ ] Corbits platform fee

---

## Action Items

### Garbonzo

- [x] Build gateway ✅
- [x] Push to GHCR ✅
- [x] Deploy to SecretVM ✅
- [x] HTTPS live inside TEE ✅
- [x] Full e2e paid inference verified ✅
- [x] On-chain payment proof (3.37 → 3.36 USDC) ✅
- [ ] Brief Alex — share writeup + repo + demo output
- [ ] Alex approves → message Pontus
- [ ] Join Flex preview: https://t.me/+yRlfSOV65vxhNzEx

### Secret Labs (after handoff)

- [ ] Deploy image on Secret Labs infrastructure
- [ ] Provide production URL to Pontus

### Pontus / ABK

- [ ] Set up `scrt.api.corbits.dev` → production URL
- [ ] Float agent template to Crossmint
- [ ] Provide Flex preview facilitator endpoint
