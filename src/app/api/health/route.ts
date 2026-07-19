import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Diagnostic endpoint — never throws; reports env presence + DB connectivity so
// deploy issues can be read directly (no secrets are exposed; values are masked).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function maskUrl(u: string | undefined) {
  if (!u) return null;
  return u.replace(/:\/\/[^@]*@/, "://***:***@").slice(0, 90);
}

export async function GET() {
  const out: Record<string, unknown> = {
    ok: false,
    env: {
      SESSION_SECRET_present: !!process.env.SESSION_SECRET,
      SESSION_SECRET_length: process.env.SESSION_SECRET?.length ?? 0,
      DATABASE_URL_present: !!process.env.DATABASE_URL,
      DATABASE_URL_masked: maskUrl(process.env.DATABASE_URL),
      DIRECT_URL_present: !!process.env.DIRECT_URL,
      NODE_VERSION: process.version,
    },
    db: { ok: false, userCount: null as number | null, error: null as string | null },
  };
  try {
    (out.db as Record<string, unknown>).userCount = await prisma.user.count();
    (out.db as Record<string, unknown>).ok = true;
    out.ok = true;
  } catch (e) {
    (out.db as Record<string, unknown>).error =
      (e instanceof Error ? `${e.name}: ${e.message}` : String(e)).slice(0, 400);
  }
  return NextResponse.json(out);
}
