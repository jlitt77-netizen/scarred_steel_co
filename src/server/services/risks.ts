import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { riskCreateSchema, type RiskCreateInput } from "@/lib/validation";
import { riskScore, riskExposure, byPriority } from "@/server/risk/scoring";

// The Risk center is confidential/internal-only (Section 32) — every operation
// gates on the confidential risk:* permissions.

export async function listRisks(ctx: AuthContext) {
  requirePermission(ctx, "risk:read");
  return prisma.risk.findMany({
    include: { project: true, vehicle: true, owner: true },
    orderBy: [{ status: "asc" }, { severity: "desc" }],
  });
}

/** Risk register with priority score, sorted worst-first, plus exposure totals. */
export async function getRiskRegister(ctx: AuthContext) {
  requirePermission(ctx, "risk:read");
  const risks = await prisma.risk.findMany({
    include: { project: { select: { name: true } }, vehicle: { select: { year: true, make: true, model: true } }, owner: { select: { name: true } } },
  });
  const withScore = risks
    .map((r) => ({ ...r, score: riskScore(r.severity, r.likelihood) }))
    .sort((a, b) => {
      if (a.status !== b.status) {
        const open = (s: string) => (s === "open" || s === "mitigating" ? 0 : 1);
        if (open(a.status) !== open(b.status)) return open(a.status) - open(b.status);
      }
      return byPriority(a, b);
    });
  const exceptions = withScore.filter((r) => (r.status === "open" || r.status === "mitigating") && r.score >= 6);
  return { risks: withScore, exposure: riskExposure(risks), exceptions };
}

export async function createRisk(ctx: AuthContext, input: RiskCreateInput) {
  requirePermission(ctx, "risk:write");
  const data = riskCreateSchema.parse(input);
  const risk = await prisma.risk.create({
    data: { ...data, createdById: ctx.userId, updatedById: ctx.userId },
  });
  await writeAudit({
    entityType: "Risk",
    entityId: risk.id,
    action: "create",
    after: risk,
    userId: ctx.userId,
  });
  return risk;
}

export async function updateRisk(ctx: AuthContext, id: string, input: unknown) {
  requirePermission(ctx, "risk:write");
  const data = riskCreateSchema.partial().parse(input);
  const before = await prisma.risk.findUnique({ where: { id } });
  if (!before) throw new Error("Risk not found");
  const risk = await prisma.risk.update({
    where: { id },
    data: { ...data, updatedById: ctx.userId },
  });
  await writeAudit({
    entityType: "Risk",
    entityId: id,
    action: "update",
    before,
    after: risk,
    userId: ctx.userId,
  });
  return risk;
}
