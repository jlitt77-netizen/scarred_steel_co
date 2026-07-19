import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import {
  vehicleCreateSchema,
  vehicleUpdateSchema,
  type VehicleCreateInput,
} from "@/lib/validation";
import { computeVehicleMetrics } from "@/lib/vehicle-metrics";
import type { Vehicle } from "@prisma/client";

export function withMetrics(v: Vehicle) {
  return { ...v, metrics: computeVehicleMetrics(v) };
}

export async function listVehicles(ctx: AuthContext) {
  requirePermission(ctx, "vehicle:read");
  const vehicles = await prisma.vehicle.findMany({
    orderBy: [{ status: "asc" }, { year: "asc" }],
  });
  return vehicles.map(withMetrics);
}

export async function getVehicle(ctx: AuthContext, id: string) {
  requirePermission(ctx, "vehicle:read");
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { projects: true },
  });
  if (!vehicle) return null;
  return { ...withMetrics(vehicle), projects: vehicle.projects };
}

export async function createVehicle(ctx: AuthContext, input: VehicleCreateInput) {
  requirePermission(ctx, "vehicle:write");
  const data = vehicleCreateSchema.parse(input);
  const vehicle = await prisma.vehicle.create({
    data: { ...data, createdById: ctx.userId, updatedById: ctx.userId },
  });
  await writeAudit({
    entityType: "Vehicle",
    entityId: vehicle.id,
    action: "create",
    after: vehicle,
    userId: ctx.userId,
  });
  return withMetrics(vehicle);
}

export async function updateVehicle(
  ctx: AuthContext,
  id: string,
  input: unknown,
) {
  requirePermission(ctx, "vehicle:write");
  const data = vehicleUpdateSchema.parse(input);
  const before = await prisma.vehicle.findUnique({ where: { id } });
  if (!before) throw new Error("Vehicle not found");
  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: { ...data, updatedById: ctx.userId },
  });
  await writeAudit({
    entityType: "Vehicle",
    entityId: id,
    action: "update",
    before,
    after: vehicle,
    userId: ctx.userId,
  });
  return withMetrics(vehicle);
}
