-- Enable Row-Level Security (RLS) on every table in the `public` schema.
--
-- WHY
--   This project runs on Supabase, which exposes a public PostgREST API together
--   with `anon` and `authenticated` API keys. When a table has RLS *disabled*,
--   anyone holding the project URL + anon key can read, edit, and delete every
--   row in it. Supabase's linter flags this as the CRITICAL "Table publicly
--   accessible" issue (lint `rls_disabled_in_public`).
--
--   Enabling RLS with NO policies flips the default for the `anon` and
--   `authenticated` roles to deny-all, closing the hole. That is the correct
--   posture for this app: it never talks to Postgres through the anon key — all
--   data access goes through Prisma.
--
-- WHY THE APP KEEPS WORKING
--   Prisma connects as the `postgres` role, which has the BYPASSRLS attribute
--   (as does `service_role`). RLS is never enforced against those roles, so
--   server-side queries are completely unaffected. Only the public API roles,
--   which the app does not use, are locked out.
--
--   No policies are created on purpose: adding one would *grant* the public
--   roles access, which is the opposite of what we want here.
--
-- IDEMPOTENT
--   `ENABLE ROW LEVEL SECURITY` is safe to run repeatedly, and the loop below
--   covers every current base table in `public` (including `_prisma_migrations`).
--   This keeps `prisma migrate reset` / fresh deploys secure by default.

DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
  END LOOP;
END $$;
