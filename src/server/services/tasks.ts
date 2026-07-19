import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import {
  taskCreateSchema,
  taskUpdateSchema,
  type TaskCreateInput,
} from "@/lib/validation";

export async function listTasks(ctx: AuthContext, projectId?: string) {
  requirePermission(ctx, "task:read");
  return prisma.task.findMany({
    where: projectId ? { projectId } : undefined,
    include: { owner: true, phase: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function createTask(ctx: AuthContext, input: TaskCreateInput) {
  requirePermission(ctx, "task:write");
  const data = taskCreateSchema.parse(input);
  const project = await prisma.project.findUnique({ where: { id: data.projectId } });
  if (!project) throw new Error("Project not found for task");
  const task = await prisma.task.create({
    data: { ...data, createdById: ctx.userId, updatedById: ctx.userId },
  });
  await writeAudit({
    entityType: "Task",
    entityId: task.id,
    action: "create",
    after: task,
    userId: ctx.userId,
  });
  return task;
}

export async function updateTask(ctx: AuthContext, id: string, input: unknown) {
  requirePermission(ctx, "task:write");
  const data = taskUpdateSchema.parse(input);
  const before = await prisma.task.findUnique({ where: { id } });
  if (!before) throw new Error("Task not found");
  const task = await prisma.task.update({
    where: { id },
    data: { ...data, updatedById: ctx.userId },
  });
  await writeAudit({
    entityType: "Task",
    entityId: id,
    action: "update",
    before,
    after: task,
    userId: ctx.userId,
  });
  return task;
}
