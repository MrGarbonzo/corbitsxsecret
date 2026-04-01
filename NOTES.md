# Corbits x Secret Network — Partnership Research Notes

**Last updated:** 2026-03-31  
**Status:** Phase 2 in progress — Docker image built, ready to push

---

## 1. Corbits (`corbits.dev`)

**Tagline:** "Infrastructure for Agentic Commerce"  
**Twitter/X:** [@corbits_dev](https://x.com/corbits_dev)  
**GitHub:** [github.com/faremeter](https://github.com/faremeter)

### Core products
| Product | Description |
|---|---|
| **Discovery** | `npx skills add corbits-infra/corbits-skill` |
| **Marketplace** | 70+ live services, real x402 payments |
| **Flex** | Variable-cost escrow — developer preview invited, NOT yet on facilitator |
| **Faremeter** | Underlying open-source framework |

### Secret Network subdomain
`scrt.api.corbits.dev` — confirmed by Pontus, org-level access with member/admin perms

---

## 2. Faremeter (`faremeter.xyz`)

**GitHub:** [github.com/faremeter/faremeter](https://github.com/faremeter/faremeter) — v0.17.1  
**License:** LGPL-3.0 | **Built by:** ABK Labs

### Hosted facilitator — `https://facilitator.corbits.dev`
Verified 2026-03-31:

| Scheme | Networks | x402 Version |
|---|---|---|
| exact | solana-mainnet-beta, solana-devnet | v1 |
| exact | base, base-sepolia | v1 |
| exact | monad, monad-testnet | v1 |
| exact | skale-base, skale-base-sepolia | v1 |
| exact | solana (CAIP-2) | v2 |
| exact | eip155 chains (Base, Monad, SKALE) | v2 |

- ✅ solana-mainnet-beta exact — used in Phase 1-2
- ✅ Both SPL Token programs, both x402 versions
- ❌ **Flex NOT present** — ask Pontus for preview facilitator URL

---

## 3. Build Repo & Deployment

**Repo:** `https://github.com/MrGarbonzo/corbitsxsecret`  
**Local:** `C:\dev\corbitsxsecret`  
**GHCR image:** `ghcr.io/mrgarbonzo/corbitsxsecret:latest`  
**Playground (Phase 1 dev):** `C:\dev\faremeter-playground`

### Repo contents
```
apps/
  client-test/          ← @faremeter/rides test client
  secret-ai-gateway/    ← Hono x402 payment gateway
    src/index.ts
    Dockerfile
.github/workflows/
  docker-publish.yml    ← builds + pushes to GHCR on push to main
docker-compose.yaml     ← SecretVM workload definition
NOTES.md
PLAN.md
```

### Build status (2026-03-31)
- Prettier: ✅ pass
- ESLint: ✅ pass
- Docker build `ghcr.io/mrgarbonzo/corbitsxsecret:latest`: ✅ pass
- Local gateway verified: /health 200, /v1/models 402 correct

### Key TS fix applied
`exactOptionalPropertyTypes` — body spread pattern:
```typescript
const hasBody = c.req.method !== "GET" && c.req.method !== "HEAD";
...(hasBody ? { body: c.req.raw.body, duplex: "half" as const } : {})
```
Applied in both repos.

### docker-compose.yaml (SecretVM workload)
```yaml
services:
  secret-ai-gateway:
    image: ghcr.io/mrgarbonzo/corbitsxsecret:latest
    ports:
      - "21434:21434"
    environment:
      - SECRETAI_BASE_URL
      - SECRET_AI_API_KEY
      - PAYMENT_RECEIVE_ADDRESS
      - PORT=21434
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:21434/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
```

### 402 payload verified
- `payTo`: `7DEYurQYP68WUxSkSzByCi7DXtokpzbZi9VxqKZJVwvU`
- `asset`: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (USDC mainnet)
- `network`: solana-mainnet-beta
- `maxAmountRequired`: $0.01 USDC

---

## 4. Secret AI SDK

**Upstream URL:** `https://secretai-rytn.scrtlabs.com:21434`  
**Protocol:** OpenAI-compatible, SSE streaming  
**Auth:** `Authorization: Bearer $SECRET_AI_API_KEY`  
**Dev portal:** https://aidev.scrtlabs.com/  
**On-chain model registry:** `secret1xv90yettghx8uv6ug23knaf5mjqwlsghau6aqa` on `secret-4`

Gateway bridge: TypeScript proxy forwards Bearer token. Python SDK used once for URL discovery only. No Python in Docker image.

---

## 5. Flex (`flex.faremeter.xyz`)

**Invited:** Yes — https://t.me/+yRlfSOV65vxhNzEx  
**On facilitator:** ❌ Not yet — only exact scheme confirmed  
**Obligations:** GitHub feedback + implementation + GTM support  
**Next:** Ask Pontus for preview facilitator URL

---

## Meeting Notes — 2026-03-31

**Attendees:** Pope Black, Alex Zaidelson (SecretLabs), Garbonzo, Pontus Andersson (ABK)  
**Key confirms:** 70+ live services, Secret has x402 capability, narrative is the missing piece, marketplace to be open-sourced.  
**Tracks agreed:** Register SecretAI + SecretVM / Agent template / Faremeter PoC

---

## Telegram Context

- **3/27 Pontus:** Recommended `faremeter-ts-playground`
- **3/31 Pontus:** @benwachman_abk (DevRel), @alxndrguy (CTO). Flex invite. `scrt.api.corbits.dev` confirmed.

---

## People & Contacts

| Name | Handle | Role | Contact |
|---|---|---|---|
| Pontus Andersson | — | ABK Labs co-founder | pontus@abklabs.com |
| Ben Wachman | @benwachman_abk | DevRel | TBD |
| Alex | @alxndrguy | CTO | TBD |

---

## Open Questions

- [x] ~~ABK Labs team?~~ → Pontus, Ben Wachman (DevRel), Alex (CTO)
- [x] ~~Flex timeline?~~ → Invited but not on facilitator yet
- [x] ~~Hosted facilitator?~~ → `facilitator.corbits.dev`
- [x] ~~Custom subdomain?~~ → `scrt.api.corbits.dev`
- [x] ~~SecretAI auth?~~ → Bearer, URL `https://secretai-rytn.scrtlabs.com:21434`
- [x] ~~OpenAI-compatible?~~ → Yes, SSE streaming
- [x] ~~Flex on facilitator?~~ → No — only exact scheme
- [x] ~~GHCR org?~~ → `ghcr.io/mrgarbonzo/corbitsxsecret`
- [ ] Flex preview facilitator URL — ask Pontus
- [ ] Corbits Path A proxy SSE streaming support — ask Ben Wachman
- [ ] Corbits platform fee

---

## Action Items

### Garbonzo
- [x] Clone playground + make passes ✅
- [x] Build gateway, verify 402 response ✅
- [x] Migrate to `MrGarbonzo/corbitsxsecret`, Docker build passes ✅
- [ ] Repo Settings → Actions → Workflow permissions → Read and write
- [ ] Push to main → verify image appears on GHCR
- [ ] Deploy to SecretVM with encrypted secrets
- [ ] Smoke test SecretVM endpoint
- [ ] Fund wallet with USDC for live end-to-end test
- [ ] Ping Pontus: claim `scrt.api.corbits.dev` + ask Flex facilitator URL
- [ ] Join Flex preview: https://t.me/+yRlfSOV65vxhNzEx
- [ ] Register SecretAI on Corbits once SecretVM URL is live

### Pontus / ABK
- [ ] Float agent template to Crossmint
- [ ] Connect Garbonzo with Ben + @alxndrguy
- [ ] Provide Flex preview facilitator endpoint
