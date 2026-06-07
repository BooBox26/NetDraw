# Multi-stage Dockerfile for NETDRAW backend
# Stage 1 — install deps + build TypeScript
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

# Copy only what npm needs to install (cache-friendly)
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
RUN npm install --no-audit --no-fund

# Now copy source + prisma schema
COPY apps/backend ./apps/backend
RUN cd apps/backend && npx prisma generate && npm run build

# Stage 2 — production runtime
FROM node:22-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache openssl tini \
  && addgroup -g 10001 -S netdraw \
  && adduser -S -u 10001 -G netdraw netdraw

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV DATABASE_URL=file:/data/netdraw.db
ENV PORT=3001
ENV HOST=0.0.0.0

# Copy only what's needed at runtime
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/scripts ./apps/backend/scripts
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./package.json
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  && mkdir -p /data && chown -R netdraw:netdraw /data /app

USER netdraw
EXPOSE 3001
VOLUME ["/data"]

ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "apps/backend/dist/server.js"]
