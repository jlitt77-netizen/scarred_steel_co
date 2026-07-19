import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";
import { writeAudit, writeChangeLog } from "@/lib/audit";
import {
  projectCreateSchema,
  projectUpdateSchema,
  phaseCreateSchema,
  type ProjectCreateInput,
  type PhaseCreateInput,
} from "@/lib/validation";

export async function listProjects(ctx: AuthContext) {
  requirePermission(ctx, "project:read");
  return prisma.project.findMany({
    include: { vehicle: true, _count: { select: { tasks: true, phases: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProject(ctx: AuthContext, id: string) {
  requirePermission(ctx, "project:read");
  return prisma.project.findUnique({
    where: { id },
    include: {
      vehicle: true,
      phases: { orderBy: { sequence: "asc" }, include: { tasks: true } },
      tasks: { include: { owner: true } },
      risks: true,
    },
  });
}

export async function createProject(ctx: AuthContext, input: ProjectCreateInput) {
  requirePermission(ctx, "project:write");
  const data = projectCreateSchema.parse(input);
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) throw new Error("Vehicle not found for project");
  const project = await prisma.project.create({
    data: { ...data, createdById: ctx.userId, updatedById: ctx.userId },
  });
  await writeAudit({
    entityType: "Project",
    entityId: project.id,
    action: "create",
    after: project,
    userId: ctx.userId,
  });
  await writeChangeLog({
    projectId: project.id,
    entityType: "Project",
    entityId: project.id,
    action: "create",
    summary: `Project "${project.name}" created`,
    userId: ctx.userId,
  });
  return project;
}

export async function updateProject(ctx: AuthContext, id: string, input: unknown) {
  requirePermission(ctx, "project:write");
  const data = projectUpdateSchema.parse(input);
  const before = await prisma.project.findUnique({ where: { id } });
  if (!before) throw new Error("Project not found");
  const project = await prisma.project.update({
    where: { id },
    data: { ...data, updatedById: ctx.userId },
  });
  await writeAudit({
    entityType: "Project",
    entityId: id,
    action: "update",
    before,
    after: project,
    userId: ctx.userId,
  });
  return project;
}

export async function addPhase(ctx: AuthContext, input: PhaseCreateInput) {
  requirePermission(ctx, "project:write");
  const data = phaseCreateSchema.parse(input);
  const phase = await prisma.buildPhase.create({
    data: { ...data, createdById: ctx.userId, updatedById: ctx.userId },
  });
  await writeAudit({
    entityType: "BuildPhase",
    entityId: phase.id,
    action: "create",
    after: phase,
    userId: ctx.userId,
  });
  return phase;
}
