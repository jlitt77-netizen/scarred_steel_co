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
  source?: "event" | "episode" | "post"; // where the item originates
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
  // Media content flows through the Master Calendar (Sections 4 & 16): episodes
  // appear on their publish date and social posts on their scheduled/publish
  // date, all as "content" occurrences. Skipped when content is filtered out,
  // or (for posts, which have no project anchor) when a project filter is set.
  const contentWanted = !wanted || wanted.has("content");
  if (contentWanted) {
    const inWindow = (d: Date | null | undefined): d is Date => !!d && d >= from && d <= to;
    const vLabels = new Map<string, string>();
    for (const e of events) if (e.vehicle) vLabels.set(e.vehicle.id, `${e.vehicle.year} ${e.vehicle.model}`);

    const episodes = await prisma.episode.findMany({
      where: filters.vehicleId ? { vehicleId: filters.vehicleId } : filters.projectId ? { projectId: filters.projectId } : {},
      select: { id: true, title: true, vehicleId: true, projectId: true, plannedPublishDate: true, publishedDate: true },
    });
    for (const ep of episodes) {
      const date = ep.publishedDate ?? ep.plannedPublishDate;
      if (!inWindow(date)) continue;
      items.push({
        key: `ep:${ep.id}`, eventId: ep.id, title: `📺 ${ep.title}`, type: "content",
        category: "content", date: date.toISOString().slice(0, 10), amountCents: null,
        vehicleId: ep.vehicleId, vehicleLabel: ep.vehicleId ? vLabels.get(ep.vehicleId) ?? null : null,
        projectId: ep.projectId, taskId: null, source: "episode",
      });
    }

    if (!filters.projectId) {
      const posts = await prisma.socialPost.findMany({
        where: filters.vehicleId ? { vehicleId: filters.vehicleId } : {},
        select: { id: true, title: true, platform: true, vehicleId: true, scheduledDate: true, publishedDate: true },
      });
      for (const p of posts) {
        const date = p.publishedDate ?? p.scheduledDate;
        if (!inWindow(date)) continue;
        items.push({
          key: `post:${p.id}`, eventId: p.id, title: `${p.platform}: ${p.title}`, type: "social",
          category: "content", date: date.toISOString().slice(0, 10), amountCents: null,
          vehicleId: p.vehicleId, vehicleLabel: p.vehicleId ? vLabels.get(p.vehicleId) ?? null : null,
          projectId: null, taskId: null, source: "post",
        });
      }
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
