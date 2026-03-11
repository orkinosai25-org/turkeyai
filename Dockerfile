# ── Stage 1: Build the React client ──────────────────────────────────────────
FROM node:24-alpine AS client-builder

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci --omit=dev

COPY client/ ./
RUN npm run build

# ── Stage 2: Production server image ─────────────────────────────────────────
FROM node:24-alpine AS server

# Tighten the image: run as a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Server dependencies
COPY server/package*.json ./
RUN npm ci --omit=dev

# Server source
COPY server/ ./

# Pre-built React client output served as static files in production
COPY --from=client-builder /app/client/build ./client/build

# Drop privileges
USER appuser

# Azure App Service routes traffic to port 8080 by default; the app reads PORT
# from env so it works on any port.
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "server.js"]
