import { NextResponse } from "next/server";

// Bulletproof diagnostic — constructs its own Prisma client inside try/catch so
// even a missing/blank/invalid DATABASE_URL returns readable JSON instead of
// crashing the route. Secrets are masked. Remove once the deploy is healthy.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function maskUrl(u: string | undefined) {
  if (u == null) return null;
  if (u === "") return "(empty string)";
  return u.replace(/:\/\/[^@]*@/, "://***:***@").slice(0, 100);
}

export async function GET() {
  const env = {
    SESSION_SECRET_present: !!process.env.SESSION_SECRET,
    SESSION_SECRET_length: process.env.SESSION_SECRET?.length ?? 0,
    DATABASE_URL_present: process.env.DATABASE_URL != null,
    DATABASE_URL_startsWithProtocol: (process.env.DATABASE_URL ?? "").startsWith("postgres"),
    DATABASE_URL_masked: maskUrl(process.env.DATABASE_URL),
    DIRECT_URL_present: process.env.DIRECT_URL != null,
    DIRECT_URL_masked: maskUrl(process.env.DIRECT_URL),
    NODE_VERSION: process.version,
  };

  const db: { ok: boolean; userCount: number | null; error: string | null } = {
    ok: false,
    userCount: null,
    error: null,
  };

  try {
    const { PrismaClient } = await import("@prisma/client");
    const client = new PrismaClient();
    try {
      db.userCount = await client.user.count();
      db.ok = true;
    } finally {
      await client.$disconnect().catch(() => {});
    }
  } catch (e) {
    db.error = (e instanceof Error ? `${e.name}: ${e.message}` : String(e)).slice(0, 500);
  }

  return NextResponse.json({ ok: db.ok, env, db });
}
