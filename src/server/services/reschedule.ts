import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";
import { writeAudit, writeChangeLog } from "@/lib/audit";
import {
  computeCascade,
  detectOwnerConflicts,
  addDays,
  type TaskNode,
  type DependencyEdge,
} from "@/server/scheduling/graph";
import {
  computeImpact,
  type EventNode,
  type ImpactPreview,
  type DateField,
} from "@/server/scheduling/impact";

const DATE_FIELDS: DateField[] = ["workDate", "cashDate", "contentDate", "revenueDate"];

/** Load the graph needed to reschedule `rootTaskId`: the project's tasks + deps,
 *  the events attached to affected tasks, and any same-owner tasks (for
 *  cross-project resource-conflict detection). */
async function loadContext(rootTaskId: string) {
  const root = await prisma.task.findUnique({ where: { id: rootTaskId } });
  if (!root) throw new Error("Task not found");

  const projectTasks = await prisma.task.findMany({ where: { projectId: root.projectId } });
  const deps = await prisma.dependency.findMany({
    where: { predecessor: { projectId: root.projectId } },
  });

  const tasks: TaskNode[] = projectTasks.map((t) => ({
    id: t.id, title: t.title, projectId: t.projectId, ownerId: t.ownerId,
    plannedStart: t.plannedStart, plannedEnd: t.plannedEnd,
  }));
  const edges: DependencyEdge[] = deps.map((d) => ({
    predecessorId: d.predecessorId, successorId: d.successorId, type: d.type, lagDays: d.lagDays,
  }));

  return { root, tasks, edges };
}

export async function previewReschedule(
  ctx: AuthContext,
  rootTaskId: string,
  deltaDays: number,
): Promise<ImpactPreview> {
  requirePermission(ctx, "event:write");
  const { tasks, edges } = await loadContext(rootTaskId);

  const shifts = computeCascade(tasks, edges, rootTaskId, deltaDays);
  const affectedIds = shifts.map((s) => s.taskId);

  const events = await prisma.event.findMany({ where: { taskId: { in: affectedIds } } });
  const eventNodes: EventNode[] = events.map((e) => ({
    id: e.id, title: e.title, type: e.type, taskId: e.taskId,
    amountCents: e.amountCents, workDate: e.workDate, cashDate: e.cashDate,
    contentDate: e.contentDate, revenueDate: e.revenueDate,
  }));

  // Same-owner tasks across the whole DB for resource-conflict detection.
  const owners = [...new Set(shifts.map((s) => s.ownerId).filter(Boolean))] as string[];
  const ownerTasks = owners.length
    ? await prisma.task.findMany({ where: { ownerId: { in: owners } } })
    : [];
  const conflictPool: TaskNode[] = ownerTasks.map((t) => ({
    id: t.id, title: t.title, projectId: t.projectId, ownerId: t.ownerId,
    plannedStart: t.plannedStart, plannedEnd: t.plannedEnd,
  }));
  const conflicts = detectOwnerConflicts(conflictPool, shifts);

  return computeImpact(rootTaskId, deltaDays, shifts, eventNodes, conflicts);
}

export interface ApplyResult {
  applied: boolean;
  impact: ImpactPreview;
  changeLogId: string;
}

/**
 * Apply an approved reschedule as ONE transaction: shift task dates, shift the
 * four dates on attached events, write the narrative ChangeLog + per-entity
 * AuditLog, and notify affected owners. "Nothing important moves silently."
 */
export async function applyReschedule(
  ctx: AuthContext,
  rootTaskId: string,
  deltaDays: number,
): Promise<ApplyResult> {
  requirePermission(ctx, "event:write");
  const impact = await previewReschedule(ctx, rootTaskId, deltaDays);
  const root = await prisma.task.findUnique({ where: { id: rootTaskId } });
  if (!root) throw new Error("Task not found");

  const changeLogId = await prisma.$transaction(async (tx) => {
    // 1. Shift tasks
    for (const s of impact.taskShifts) {
      await tx.task.update({
        where: { id: s.taskId },
        data: { plannedStart: s.newStart, plannedEnd: s.newEnd, updatedById: ctx.userId },
      });
      await writeAudit(
        {
          entityType: "Task", entityId: s.taskId, action: "reschedule", field: "plannedStart",
          before: { plannedStart: s.oldStart, plannedEnd: s.oldEnd },
          after: { plannedStart: s.newStart, plannedEnd: s.newEnd },
          userId: ctx.userId,
        },
        tx,
      );
    }

    // 2. Shift the four dates on attached events
    for (const es of impact.eventShifts) {
      const data: Record<string, Date> = {};
      for (const f of DATE_FIELDS) {
        const ch = es.changes[f];
        if (ch) data[f] = ch.next;
      }
      if (Object.keys(data).length === 0) continue;
      await tx.event.update({
        where: { id: es.eventId },
        data: { ...data, updatedById: ctx.userId },
      });
      await writeAudit(
        { entityType: "Event", entityId: es.eventId, action: "reschedule", after: data, userId: ctx.userId },
        tx,
      );
    }

    // 3. Narrative change log with the full impact payload
    const dir = deltaDays >= 0 ? "later" : "earlier";
    const summary = `Rescheduled "${root.title}" ${Math.abs(deltaDays)} day(s) ${dir} — ${impact.counts.downstreamTasks} downstream task(s), ${impact.eventShifts.length} event(s) shifted`;
    const log = await writeChangeLog(
      {
        projectId: root.projectId, entityType: "Task", entityId: rootTaskId,
        action: "cascade", summary, detail: impact, userId: ctx.userId,
      },
      tx,
    );

    // 4. Notify affected owners
    const owners = [...new Set(impact.taskShifts.map((s) => s.ownerId).filter(Boolean))] as string[];
    for (const ownerId of owners) {
      await tx.notification.create({
        data: {
          userId: ownerId, type: "schedule_change",
          title: `Schedule changed: ${root.title}`,
          body: summary, entityType: "Task", entityId: rootTaskId,
        },
      });
    }

    return log.id;
  });

  return { applied: true, impact, changeLogId };
}

export { addDays };
