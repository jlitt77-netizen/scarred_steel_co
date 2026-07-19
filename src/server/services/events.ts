import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { eventCreateSchema, type EventCreateInput } from "@/lib/validation";

/**
 * List events overlapping a date window across ANY of the four independent
 * dates. This is what lets the Master Calendar show operational, financial,
 * content, and revenue timing together (Section 4).
 */
export async function listEvents(
  ctx: AuthContext,
  opts: { from?: Date; to?: Date; projectId?: string; vehicleId?: string } = {},
) {
  requirePermission(ctx, "event:read");
  const inRange = (field: "workDate" | "cashDate" | "contentDate" | "revenueDate") => {
    const cond: Record<string, unknown> = { not: null };
    if (opts.from) cond.gte = opts.from;
    if (opts.to) cond.lte = opts.to;
    return { [field]: cond };
  };
  return prisma.event.findMany({
    where: {
      AND: [
        opts.projectId ? { projectId: opts.projectId } : {},
        opts.vehicleId ? { vehicleId: opts.vehicleId } : {},
        opts.from || opts.to
          ? {
              OR: [
                inRange("workDate"),
                inRange("cashDate"),
                inRange("contentDate"),
                inRange("revenueDate"),
              ],
            }
          : {},
      ],
    },
    orderBy: { workDate: "asc" },
  });
}

export async function createEvent(ctx: AuthContext, input: EventCreateInput) {
  requirePermission(ctx, "event:write");
  const data = eventCreateSchema.parse(input);
  const event = await prisma.event.create({
    data: { ...data, createdById: ctx.userId, updatedById: ctx.userId },
  });
  await writeAudit({
    entityType: "Event",
    entityId: event.id,
    action: "create",
    after: event,
    userId: ctx.userId,
  });
  return event;
}

/**
 * Reschedule a SINGLE date on an event, independently of the others. Phase 2
 * layers dependency cascade + impact preview on top of this primitive; the
 * audit entry here already guarantees "nothing moves silently".
 */
export async function moveEventDate(
  ctx: AuthContext,
  id: string,
  field: "workDate" | "cashDate" | "contentDate" | "revenueDate",
  newDate: Date | null,
) {
  requirePermission(ctx, "event:write");
  const before = await prisma.event.findUnique({ where: { id } });
  if (!before) throw new Error("Event not found");
  const event = await prisma.event.update({
    where: { id },
    data: { [field]: newDate, updatedById: ctx.userId },
  });
  await writeAudit({
    entityType: "Event",
    entityId: id,
    action: "reschedule",
    field,
    before: before[field],
    after: newDate,
    userId: ctx.userId,
  });
  return event;
}
