import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";

// The Master Calendar shows operational, financial, content, and revenue timing
// together (Section 4). Each event is expanded into up to four "occurrences" —
// one per non-null date field — each carrying its category color.

export type CalendarCategory = "work" | "cash" | "content" | "revenue";

const FIELD_CATEGORY: Record<string, CalendarCategory> = {
  workDate: "work",
  cashDate: "cash",
  contentDate: "content",
  revenueDate: "revenue",
};

export interface CalendarItem {
  key: string; // eventId + field
  eventId: string;
  title: string;
  type: string;
  category: CalendarCategory;
  date: string; // ISO date (YYYY-MM-DD)
  amountCents: number | null;
  vehicleId: string | null;
  vehicleLabel: string | null;
  projectId: string | null;
  taskId: string | null;
}

export interface CalendarFilters {
  from: Date;
  to: Date;
  vehicleId?: string;
  projectId?: string;
  categories?: CalendarCategory[];
}

export async function getCalendarItems(
  ctx: AuthContext,
  filters: CalendarFilters,
): Promise<CalendarItem[]> {
  requirePermission(ctx, "calendar:read");
  const { from, to } = filters;

  const events = await prisma.event.findMany({
    where: {
      AND: [
        filters.vehicleId ? { vehicleId: filters.vehicleId } : {},
        filters.projectId ? { projectId: filters.projectId } : {},
        {
          OR: [
            { workDate: { gte: from, lte: to } },
            { cashDate: { gte: from, lte: to } },
            { contentDate: { gte: from, lte: to } },
            { revenueDate: { gte: from, lte: to } },
          ],
        },
      ],
    },
    include: { vehicle: true },
  });

  const wanted = filters.categories && filters.categories.length
    ? new Set(filters.categories)
    : null;

  const items: CalendarItem[] = [];
  for (const e of events) {
    for (const field of ["workDate", "cashDate", "contentDate", "revenueDate"] as const) {
      const date = e[field];
      if (!date || date < from || date > to) continue;
      const category = FIELD_CATEGORY[field];
      if (wanted && !wanted.has(category)) continue;
      items.push({
        key: `${e.id}:${field}`,
        eventId: e.id,
        title: e.title,
        type: e.type,
        category,
        date: date.toISOString().slice(0, 10),
        amountCents: e.amountCents,
        vehicleId: e.vehicleId,
        vehicleLabel: e.vehicle ? `${e.vehicle.year} ${e.vehicle.model}` : null,
        projectId: e.projectId,
        taskId: e.taskId,
      });
    }
  }
  items.sort((a, b) => a.date.localeCompare(b.date));
  return items;
}

/** Filter options for the calendar toolbar. */
export async function getCalendarFilterOptions(ctx: AuthContext) {
  requirePermission(ctx, "calendar:read");
  const [vehicles, projects] = await Promise.all([
    prisma.vehicle.findMany({ orderBy: { year: "asc" }, select: { id: true, year: true, make: true, model: true } }),
    prisma.project.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { vehicles, projects };
}

/** Recent schedule/budget change history (Section 34) for the calendar panel. */
export async function getRecentChangeLogs(ctx: AuthContext, take = 25) {
  requirePermission(ctx, "calendar:read");
  return prisma.changeLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { project: { select: { name: true } } },
  });
}
