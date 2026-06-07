#!/bin/sh
# Apply Prisma migrations and start the backend.
# If migrations directory is missing (dev image), generate the client and create
# the database via prisma db push instead.

set -e

cd /app/apps/backend

if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "[entrypoint] applying Prisma migrations…"
  npx prisma migrate deploy
else
  echo "[entrypoint] no migrations folder found, using prisma db push"
  npx prisma db push --skip-generate --accept-data-loss
  npx prisma generate
fi

echo "[entrypoint] starting NETDRAW backend…"
cd /app
exec "$@"
