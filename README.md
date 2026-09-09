Corbits x Secret Network — Partnership Research Notes
Last updated: 2026-04-01
Status: ✅ REGISTERED ON CORBITS — live at https://my-test-proxy.garbonzo.api.corbits.dev

1. Corbits (corbits.dev)
Tagline: "Infrastructure for Agentic Commerce"
Twitter/X: @corbits_dev
GitHub: github.com/faremeter

Core products
Product	Description
Discovery	npx skills add corbits-infra/corbits-skill
Marketplace	70+ live services, real x402 payments
Flex	Variable-cost escrow — invited to preview, NOT yet on facilitator
Faremeter	Underlying open-source framework
Registration — KEY FINDING
Corbits registration is self-service via their website — no Faremeter middleware needed in the image. Corbits acts as a proxy in front of your endpoint (Path A). The Faremeter backend is built into the Corbits platform, not our image. You just point Corbits at your URL and set a price.

Secret Network endpoint on Corbits
https://my-test-proxy.garbonzo.api.corbits.dev ✅ LIVE

2. Faremeter (faremeter.xyz)
GitHub: github.com/faremeter/faremeter — v0.17.1
License: LGPL-3.0 | Built by: ABK Labs

Hosted facilitator — https://facilitator.corbits.dev
Verified 2026-03-31 — only exact scheme, Flex not yet deployed.

Scheme	Networks	x402 Version
exact	solana-mainnet-beta, solana-devnet	v1
exact	base, base-sepolia	v1
exact	monad, monad-testnet	v1
exact	skale-base, skale-base-sepolia	v1
exact	solana (CAIP-2)	v2
exact	eip155 chains (Base, Monad, SKALE)	v2
3. What Was Built & Deployed
Path A — Corbits proxy (current, simpler)
Registered SecretAI endpoint on Corbits website
Corbits proxies in front, handles x402 payment wall
No Faremeter middleware needed in our Docker image
Live: https://my-test-proxy.garbonzo.api.corbits.dev
Path B — Native middleware (demo VM, still running)
Gateway built from faremeter-ts-playground
Faremeter middleware runs inside SecretVM
Demo: https://peach-camel.vm.scrtlabs.com
Can be shut down — Path A is the active integration
Repo
https://github.com/MrGarbonzo/corbitsxsecret
ghcr.io/mrgarbonzo/corbitsxsecret:latest

Full end-to-end test — ✅ VERIFIED (2026-04-01)
Wallet: Cs8cX73EWAxKQ9iNUpqTZMv5bEfoiSNsHKVsgbz42gZZ
Balance before: 3.37 USDC → after: 3.36 USDC
Model: llama3.3:70b
Response: "Hello, it's nice to meet you and I'm looking forward to chatting with you!"
4. Secret AI SDK
Upstream: https://secretai-rytn.scrtlabs.com:21434
Protocol: OpenAI-compatible, SSE streaming
Auth: Authorization: Bearer $SECRET_AI_API_KEY
Dev portal: https://aidev.scrtlabs.com/

5. Flex (flex.faremeter.xyz)
Invited: Yes — https://t.me/+yRlfSOV65vxhNzEx
On facilitator: ❌ Not yet
Next: Ask Pontus for preview facilitator URL
