import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { computeVehicleMetrics } from "@/lib/vehicle-metrics";
import { assessFleetAsset } from "@/server/fleet/keep-sell";
import type { FleetAssessment } from "@prisma/client";

// Fleet & Long-Term Assets (Section 20). Keep-vs-sell across every vehicle,
// reusing the shared vehicle economics and the pure keep/sell engine.
// Gated on vehicle:read / vehicle:write.

export async function listFleet(ctx: AuthContext) {
  requirePermission(ctx, "vehicle:read");
  const [vehicles, assessments] = await Promise.all([
    prisma.vehicle.findMany({ orderBy: { year: "asc" } }),
    prisma.fleetAssessment.findMany(),
  ]);
  const byVehicle = new Map(assessments.map((a) => [a.vehicleId, a]));
  return vehicles.map((v) => {
    const a = byVehicle.get(v.id);
    const metrics = computeVehicleMetrics(v);
    const result = assessFleetAsset(a ?? {});
    return {
      id: v.id,
      label: `${v.year} ${v.make} ${v.model}`,
      nickname: v.nickname,
      classification: v.classification,
      status: v.status,
      trueCashInvestedCents: metrics.trueCashInvestedCents,
      currentMarketValueCents: v.currentMarketValueCents,
      hasAssessment: !!a,
      ...result,
    };
  });
}

export async function getFleetSummary(ctx: AuthContext) {
  requirePermission(ctx, "vehicle:read");
  const fleet = await listFleet(ctx);
  const tally = { KEEP: 0, "REVIEW ANNUALLY": 0, "SELL CANDIDATE": 0 } as Record<string, number>;
  let netAnnualCents = 0, investedCents = 0, marketCents = 0;
  for (const f of fleet) {
    tally[f.recommendation] = (tally[f.recommendation] ?? 0) + 1;
    netAnnualCents += f.netAnnualCents;
    investedCents += f.trueCashInvestedCents;
    marketCents += f.currentMarketValueCents ?? 0;
  }
  return { count: fleet.length, tally, netAnnualCents, investedCents, marketCents };
}

export async function upsertFleetAssessment(
  ctx: AuthContext,
  vehicleId: string,
  data: Omit<FleetAssessment, "id" | "vehicleId" | "createdAt" | "updatedAt" | "createdById" | "updatedById">,
) {
  requirePermission(ctx, "vehicle:write");
  const row = await prisma.fleetAssessment.upsert({
    where: { vehicleId },
    create: { ...data, vehicleId, createdById: ctx.userId, updatedById: ctx.userId },
    update: { ...data, updatedById: ctx.userId },
  });
  await writeAudit({ entityType: "FleetAssessment", entityId: row.id, action: "upsert", after: row, userId: ctx.userId });
  return row;
}

export async function listVehiclesForSelect(ctx: AuthContext) {
  requirePermission(ctx, "vehicle:read");
  const vehicles = await prisma.vehicle.findMany({ select: { id: true, year: true, make: true, model: true }, orderBy: { year: "asc" } });
  return vehicles.map((v) => ({ id: v.id, name: `${v.year} ${v.make} ${v.model}` }));
}
