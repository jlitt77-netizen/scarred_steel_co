import Link from "next/link";
import { requireAuthWithPermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Panel } from "@/components/ui/primitives";
import { getCalendarItems, getCalendarFilterOptions, getRecentChangeLogs, type CalendarCategory } from "@/server/services/calendar";
import {
  CALENDAR_VIEWS, VIEW_LABEL, computeRange, parseAnchor, isoDay, stepAnchor, humanRange,
  type CalendarView,
} from "@/lib/calendar-range";
import { CALENDAR_CATEGORIES } from "@/lib/status-colors";
import { CalendarClient } from "./CalendarClient";

const ALL_CATS: CalendarCategory[] = ["work", "cash", "content", "revenue"];

async function defaultAnchor(): Promise<Date> {
  const rows = await prisma.event.findMany({
    select: { workDate: true, cashDate: true, contentDate: true, revenueDate: true },
  });
  let min: Date | null = null;
  for (const r of rows) {
    for (const d of [r.workDate, r.cashDate, r.contentDate, r.revenueDate]) {
      if (d && (!min || d < min)) min = d;
    }
  }
  return min ?? new Date();
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const ctx = await requireAuthWithPermission("calendar:read");

  const view = (CALENDAR_VIEWS.includes(sp.view as CalendarView) ? sp.view : "month") as CalendarView;
  const anchor = sp.date ? parseAnchor(sp.date, new Date()) : await defaultAnchor();
  const anchorIso = isoDay(anchor);
  const cats = (sp.cats ? sp.cats.split(",").filter((c) => ALL_CATS.includes(c as CalendarCategory)) : []) as CalendarCategory[];

  const range = computeRange(view, anchor);
  const [items, options, changeLogs] = await Promise.all([
    getCalendarItems(ctx, {
      from: range.from, to: range.to,
      vehicleId: sp.vehicle || undefined,
      projectId: sp.project || undefined,
      categories: cats.length ? cats : undefined,
    }),
    getCalendarFilterOptions(ctx),
    getRecentChangeLogs(ctx, 12),
  ]);

  const canReschedule = can(ctx, "event:write");

  // Build hrefs preserving current params.
  const base: Record<string, string> = {};
  if (sp.vehicle) base.vehicle = sp.vehicle;
  if (sp.project) base.project = sp.project;
  if (cats.length) base.cats = cats.join(",");
  const href = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams({ view, date: anchorIso, ...base });
    for (const [k, v] of Object.entries(over)) { if (v === undefined) p.delete(k); else p.set(k, v); }
    return `/os/calendar?${p.toString()}`;
  };
  const toggleCat = (c: CalendarCategory) => {
    const next = cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c];
    return href({ cats: next.length ? next.join(",") : undefined });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Scheduling"
        title="Master Calendar"
        subtitle="Work, cash, content, and expected revenue moving through time. Reschedule with dependency-aware impact preview."
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded border border-bg-gunmetal">
          {CALENDAR_VIEWS.map((v) => (
            <Link key={v} href={href({ view: v })} className={`px-3 py-1.5 text-xs ${v === view ? "bg-bg-gunmetal text-paper-warm" : "text-paper-muted hover:text-paper-steel"}`}>
              {VIEW_LABEL[v]}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Link href={href({ date: isoDay(stepAnchor(view, anchor, -1)) })} className="btn-ghost" aria-label="Previous">‹</Link>
          <Link href={href({ date: isoDay(new Date()) })} className="btn-ghost text-xs">Today</Link>
          <Link href={href({ date: isoDay(stepAnchor(view, anchor, 1)) })} className="btn-ghost" aria-label="Next">›</Link>
        </div>
        <div className="font-display text-lg uppercase tracking-wide text-paper-warm">{humanRange(view, anchor)}</div>

        <div className="ml-auto flex items-center gap-3">
          {/* Category legend / toggles */}
          <div className="flex items-center gap-2">
            {CALENDAR_CATEGORIES.map((c) => {
              const active = cats.length === 0 || cats.includes(c.key as CalendarCategory);
              return (
                <Link key={c.key} href={toggleCat(c.key as CalendarCategory)} className={`flex items-center gap-1 text-xs ${active ? "text-paper-steel" : "text-paper-muted/40"}`}>
                  <span className={`h-2.5 w-2.5 rounded-sm ${c.dot}`} /> {c.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Vehicle / project filter */}
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <input type="hidden" name="view" value={view} />
        <input type="hidden" name="date" value={anchorIso} />
        {cats.length > 0 && <input type="hidden" name="cats" value={cats.join(",")} />}
        <div>
          <label className="label" htmlFor="vehicle">Vehicle</label>
          <select id="vehicle" name="vehicle" defaultValue={sp.vehicle ?? ""} className="select w-48">
            <option value="">All vehicles</option>
            {options.vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="project">Project</label>
          <select id="project" name="project" defaultValue={sp.project ?? ""} className="select w-48">
            <option value="">All projects</option>
            {options.projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <button className="btn-secondary" type="submit">Apply filters</button>
        {(sp.vehicle || sp.project) && <Link href={href({ vehicle: undefined, project: undefined })} className="btn-ghost text-xs">Clear</Link>}
      </form>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <CalendarClient view={view} anchorIso={anchorIso} items={items} canReschedule={canReschedule} />
          <p className="mt-2 text-xs text-paper-muted">{items.length} scheduled item(s) in view.</p>
        </div>

        {/* Change history */}
        <Panel accent="neutral" title="Recent Schedule Changes" className="h-fit">
          {changeLogs.length === 0 ? (
            <p className="text-sm text-paper-muted">No schedule changes yet.</p>
          ) : (
            <ul className="space-y-2">
              {changeLogs.map((l) => (
                <li key={l.id} className="border-b border-bg-gunmetal pb-2 last:border-0">
                  <div className="text-sm text-paper-steel">{l.summary}</div>
                  <div className="mt-0.5 text-[11px] text-paper-muted tnum">
                    {l.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                    {l.project ? ` · ${l.project.name}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
