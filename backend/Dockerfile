FROM node:24-alpine AS base
WORKDIR /app

# Install dependencies separately for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# ── API server ────────────────────────────────────────────────────────────
FROM base AS api
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "src/index.js"]

# ── Background worker ─────────────────────────────────────────────────────
FROM base AS worker
CMD ["node", "src/workers/index.js"]
