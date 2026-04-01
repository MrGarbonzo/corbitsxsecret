# Corbits x Secret Network — Integration Plan

**Last updated:** 2026-03-31  
**Owner:** Garbonzo  
**Status:** 🟡 EXECUTING — Phase 2 in progress, ready to push

---

## The Asks (full picture, post-Telegram)

1. **Register Secret services on Corbits marketplace** — SecretAI + SecretVM (Garbonzo owns)
2. **Implement Flex** — formal developer preview invite, GTM commitment expected (Garbonzo owns)
3. **Agent template** — SecretVM + Crossmint wallet + Corbits skill (Pontus → Crossmint, we execute)
4. **Define the self-funding agent narrative** — Alex named this as the missing piece (implicit)

---

## Phase Tracker

| Phase | Description | Status |
|---|---|---|
| 0 | Accounts, Flex invite, corbits-skill install | ⬜ Pending |
| 1 | Playground: env verify + client test + gateway build | ✅ Complete |
| 2 | GHCR image push + SecretVM deploy | 🟡 Push pending |
| 3 | Register on Corbits marketplace (`scrt.api.corbits.dev`) | ⬜ Pending |
| 4 | Flex implementation (blocked: not on facilitator yet) | ⬜ Blocked |
| 5 | Self-funding agent demo | ⬜ Pending |
| 6 | TEE facilitator pitch | ⬜ Pending (month 2+) |

---

## Phase 1 Results — ✅ COMPLETE

### What was built
- `apps/client-test` — @faremeter/rides client targeting helius.api.corbits.dev
- `apps/secret-ai-gateway` — Hono payment gateway with full x402 middleware
- `apps/secret-ai-gateway/Dockerfile` — multi-stage production build
- `docker-compose.yaml` — SecretVM workload definition (workspace root)
- `.github/workflows/docker-publish.yml` — CI/CD pipeline to GHCR

### Bug fixed during Phase 2 migration
`exactOptionalPropertyTypes` TS error: `body: undefined` not assignable to `BodyInit`.  
Fixed by spreading body+duplex conditionally:
```typescript
const hasBody = c.req.method !== "GET" && c.req.method !== "HEAD";
const upstreamResponse = await fetch(upstreamUrl, {
  method: c.req.method,
  headers,
  ...(hasBody ? { body: c.req.raw.body, duplex: "half" as const } : {}),
});
```
Applied to both `C:\dev\corbitsxsecret` and `C:\dev\faremeter-playground`.

### Verified
- `/health` → 200 OK
- `/v1/models` → 402 with correct x402 payload (wallet, USDC, solana-mainnet-beta, $0.01)
- Prettier: pass | ESLint: pass
- Docker build `ghcr.io/mrgarbonzo/corbitsxsecret:latest`: **pass**

---

## Phase 2 — GHCR + SecretVM Deploy

### Step 1 — GitHub repo setup ✅ (pre-push checklist)
- [ ] Repo Settings → Actions → General → Workflow permissions → **Read and write**
- [ ] Push to main → GitHub Actions fires → image lands on GHCR

### Step 2 — Verify image is on GHCR
After push, check: `https://github.com/MrGarbonzo/corbitsxsecret/pkgs/container/corbitsxsecret`
Should show `latest` tag and git SHA tag.

### Step 3 — Create SecretVM workload
- Point workload at `MrGarbonzo/corbitsxsecret` repo + `docker-compose.yaml`
- Inject encrypted secrets:
  ```
  SECRETAI_BASE_URL=https://secretai-rytn.scrtlabs.com:21434
  SECRET_AI_API_KEY=<key>
  PAYMENT_RECEIVE_ADDRESS=7DEYurQYP68WUxSkSzByCi7DXtokpzbZi9VxqKZJVwvU
  PORT=21434
  ```

### Step 4 — Smoke test SecretVM
```bash
curl https://<secretvm-url>/health          # expect 200
curl https://<secretvm-url>/v1/models       # expect 402
```

### Step 5 — Verify attestation
TDX quote should reference the GHCR image hash. Cross-check with the image digest from GHCR.

---

## Deployment Architecture

**Repo:** `https://github.com/MrGarbonzo/corbitsxsecret`  
**GHCR image:** `ghcr.io/mrgarbonzo/corbitsxsecret:latest`

```
[push to main]
  → GitHub Actions builds Dockerfile from apps/secret-ai-gateway
  → pushes ghcr.io/mrgarbonzo/corbitsxsecret:latest + :<git-sha>

[SecretVM]
  → pulls docker-compose.yaml from MrGarbonzo/corbitsxsecret
  → pulls ghcr.io/mrgarbonzo/corbitsxsecret:latest
  → injects encrypted secrets at boot
  → TDX attestation covers running image hash

[Agent / Corbits marketplace]
  → scrt.api.corbits.dev/v1/chat/completions
  → 402 → pays $0.01 USDC → gateway proxies to SecretAI → USDC settles
```

---

## PHASE 3 — Marketplace Registration

1. Ping Pontus — claim `scrt.api.corbits.dev`, get org access
2. Register live SecretVM endpoint on Corbits dashboard
3. Validate with corbits-skill: `/corbits search secret` → `/corbits call`
4. Send ABK team status update + ask about Flex facilitator URL

---

## PHASE 4 — Flex (BLOCKED)

`facilitator.corbits.dev/supported` — only `exact` scheme. Need Pontus to provide preview facilitator URL.

---

## PHASE 5 — Self-Funding Agent Demo

SecretVM agent earning USDC from inference, autonomously spending on Corbits services.

---

## PHASE 6 — TEE Facilitator Pitch (Month 2+)

---

## Key Decisions Locked

| Decision | Answer |
|---|---|
| Build repo | `github.com/MrGarbonzo/corbitsxsecret` |
| GHCR image | `ghcr.io/mrgarbonzo/corbitsxsecret:latest` |
| Deployment | SecretVM, GHCR, docker-compose.yaml, no SSH |
| Secrets injection | SecretVM encrypted secrets at boot |
| SecretAI upstream | `https://secretai-rytn.scrtlabs.com:21434` |
| Payment wallet | `7DEYurQYP68WUxSkSzByCi7DXtokpzbZi9VxqKZJVwvU` |
| Price per request | $0.01 USDC (10000 microUSDC) |
| Network | solana-mainnet-beta, exact scheme |
| Flex | Blocked — not on facilitator yet |

## Key Decisions Still Open

| Decision | Status |
|---|---|
| Wallet funded | User funds when ready for live test |
| Flex facilitator URL | Waiting on Pontus |
| SSE via Corbits Path A proxy | Ask Ben Wachman |

---

## The One-Liners

**Bare minimum:** "Secret Network's AI inference is live on Corbits, payment-gated by Faremeter x402 inside an attested SecretVM."

**Above and beyond:** "A self-sovereign AI agent in a TEE that earns its own income and spends it autonomously — cryptographic proof no human controls the wallet or the logic."
