FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.19.0 --activate

WORKDIR /build

# Copy workspace root config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./

# Copy only the chat-demo package
COPY apps/chat-demo/ apps/chat-demo/

# Install all deps (frozen lockfile ensures reproducibility)
RUN pnpm install --frozen-lockfile

# Build TypeScript
WORKDIR /build/apps/chat-demo
RUN pnpm run build

# --- Production image ---
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10.19.0 --activate

WORKDIR /app

# Copy workspace root config for pnpm resolution
COPY --from=builder /build/pnpm-workspace.yaml /build/package.json /build/pnpm-lock.yaml ./

# Copy built app + static files
COPY --from=builder /build/apps/chat-demo/package.json apps/chat-demo/package.json
COPY --from=builder /build/apps/chat-demo/dist/ apps/chat-demo/dist/
COPY --from=builder /build/apps/chat-demo/public/ apps/chat-demo/public/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

WORKDIR /app/apps/chat-demo

EXPOSE 3000

CMD ["node", "dist/index.js"]
