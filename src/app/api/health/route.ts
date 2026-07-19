import { NextResponse } from "next/server";

// Comprehensive diagnostic — runs the exact query paths the real pages use, each
// isolated in try/catch, so we can see which one throws at runtime. Never throws.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function maskUrl(u: string | undefined) {
  if (u == null) return null;
  if (u === "") return "(empty)";
  return u.replace(/:\/\/[^@]*@/, "://***:***@").slice(0, 90);
}

async function step<T>(fn: () => Promise<T>): Promise<{ ok: boolean; value?: T; error?: string }> {
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    return { ok: false, error: (e instanceof Error ? `${e.name}: ${e.message}` : String(e)).slice(0, 400) };
  }
}

export async function GET() {
  const env = {
    SESSION_SECRET_present: !!process.env.SESSION_SECRET,
    DATABASE_URL_masked: maskUrl(process.env.DATABASE_URL),
    DIRECT_URL_masked: maskUrl(process.env.DIRECT_URL),
    NODE_VERSION: process.version,
  };

  const checks: Record<string, unknown> = {};
  try {
    const { PrismaClient } = await import("@prisma/client");
    const db = new PrismaClient();
    try {
      // 1. basic connectivity (this passed before)
      checks.userCount = await step(() => db.user.count());
      // 2. the auth-context query run on EVERY authenticated page (loadAuthContext)
      checks.authInclude = await step(async () => {
        const u = await db.user.findUnique({
          where: { email: "ceo@scarredsteel.co" },
          include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
        });
        return { found: !!u, roleCount: u?.roles.length ?? 0 };
      });
      // 3. dashboard queries
      checks.vehicles = await step(() => db.vehicle.count());
      checks.projects = await step(() => db.project.count());
      checks.risks = await step(() => db.risk.count({ where: { status: { in: ["open", "mitigating"] } } }));
      checks.settings = await step(() => db.appSetting.count());
    } finally {
      await db.$disconnect().catch(() => {});
    }
  } catch (e) {
    checks.prismaInit = (e instanceof Error ? `${e.name}: ${e.message}` : String(e)).slice(0, 400);
  }

  return NextResponse.json({ env, checks });
}
