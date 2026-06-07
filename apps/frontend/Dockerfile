# Multi-stage Dockerfile for the NETDRAW frontend.
# Stage 1 — build with Vite
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache git

COPY package.json package-lock.json* ./
COPY apps/frontend/package.json ./apps/frontend/
RUN npm install --no-audit --no-fund

COPY apps/frontend ./apps/frontend
RUN cd apps/frontend && npm run build

# Stage 2 — runtime nginx (non-root)
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

USER root
RUN apk add --no-cache curl \
  && rm -f /etc/nginx/conf.d/default.conf
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
  && touch /var/run/nginx.pid \
  && chown nginx:nginx /var/run/nginx.pid

USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD curl -fsS http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
