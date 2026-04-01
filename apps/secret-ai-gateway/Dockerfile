FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.19.0 --activate

WORKDIR /build

# Copy workspace root config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./

# Copy only the gateway package
COPY apps/secret-ai-gateway/ apps/secret-ai-gateway/

# Install all deps (frozen lockfile ensures reproducibility)
RUN pnpm install --frozen-lockfile

# Build TypeScript
WORKDIR /build/apps/secret-ai-gateway
RUN pnpm run build

# --- Production image ---
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10.19.0 --activate

WORKDIR /app

# Copy workspace root config for pnpm resolution
COPY --from=builder /build/pnpm-workspace.yaml /build/package.json /build/pnpm-lock.yaml ./

# Copy built app
COPY --from=builder /build/apps/secret-ai-gateway/package.json apps/secret-ai-gateway/package.json
COPY --from=builder /build/apps/secret-ai-gateway/dist/ apps/secret-ai-gateway/dist/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

WORKDIR /app/apps/secret-ai-gateway

EXPOSE 21434

CMD ["node", "dist/index.js"]
