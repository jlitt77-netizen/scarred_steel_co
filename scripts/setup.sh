#!/usr/bin/env bash
# Idempotent project setup: dependencies, Prisma client, dev database, seed data.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Creating .env from .env.example"
  cp .env.example .env
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies…"
  npm install
fi

echo "Generating Prisma client…"
npx prisma generate >/dev/null

echo "Applying migrations…"
npx prisma migrate deploy

# Seed only when the database has no vehicles yet (seed is itself idempotent).
echo "Seeding development data (idempotent)…"
npm run db:seed

echo "Setup complete. Start with: npm run dev"
