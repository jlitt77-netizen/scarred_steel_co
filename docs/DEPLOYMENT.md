# Deployment — Supabase + Netlify

The platform runs on **Supabase Postgres** (database) and **Netlify** (Next.js hosting).

## Provisioned infrastructure

| Service | Name | Identifier |
|---|---|---|
| Supabase org | Scout | `vsqjsxahjrlwgpmcdarg` |
| Supabase project | scarred-steel-co | ref `jiptwtxyjsciuacgbrpw` (us-east-1, $10/mo) |
| Supabase API URL | | `https://jiptwtxyjsciuacgbrpw.supabase.co` |
| Netlify team | Scout | `jlitt77-netizen` |
| Netlify site | scarred-steel-co | `d4dcb9b3-e68b-4590-a25c-b936b6dc6a3f` → https://scarred-steel-co.netlify.app |

## Database

- Prisma datasource is **PostgreSQL** with a pooled `DATABASE_URL` (pgBouncer, 6543)
  for the serverless app and a `DIRECT_URL` (5432) for migrations.
- Schema was applied via migration `prisma/migrations/*_init_postgres`, and the
  Phase 1 seed (RBAC catalog, 10 users, 3 Ford trucks with full build data) is
  loaded. Verified row counts: 37 permissions · 10 roles · 95 role-permissions ·
  10 users · 3 vehicles · 3 projects · 8 phases · 2 tasks · 1 dependency ·
  4 events · 2 risks · 5 settings.

### Connection strings

Get them from **Supabase → Project Settings → Database → Connection string**
(and reset the DB password there if unknown). Format:

```
DATABASE_URL=postgresql://postgres.jiptwtxyjsciuacgbrpw:<PASSWORD>@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.jiptwtxyjsciuacgbrpw:<PASSWORD>@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

## Netlify

- `netlify.toml` sets the build command (`npm run build`) and the
  `@netlify/plugin-nextjs` runtime; Prisma binaries include the Lambda targets
  (`rhel-openssl-1.0.x`, `rhel-openssl-3.0.x`).
- Env vars set on the site: `SESSION_SECRET` (secret, generated). Still to set:
  `DATABASE_URL` and `DIRECT_URL` (secrets — need the DB password).

## Remaining manual steps

1. **Set the DB env vars on Netlify** (or paste the password here and I'll set them):
   Site config → Environment variables → add `DATABASE_URL` and `DIRECT_URL`
   (mark as secret), using the strings above.
2. **Connect the GitHub repo for continuous deploys**: Netlify → the
   `scarred-steel-co` site → Project configuration → Build & deploy → Link
   repository → `jlitt77-netizen/scarred_steel_co`, production branch
   `claude/scarred-steel-platform-spec-9h9kr1` (or `main` once merged). Netlify
   then auto-builds on every push.
3. **First deploy** triggers on the next push once the repo is linked.

## Local development against Supabase

```bash
cp .env.example .env      # fill in DATABASE_URL, DIRECT_URL, SESSION_SECRET
npm install
npx prisma generate
npm run dev
```

Migrations: `npx prisma migrate deploy` (uses `DIRECT_URL`).
Re-seed (idempotent): `npm run db:seed`.
