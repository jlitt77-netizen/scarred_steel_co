"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CalendarItem } from "@/server/services/calendar";
import type { CalendarView } from "@/lib/calendar-range";
import { monthMatrix, computeRange, parseAnchor, isoDay, addDaysUTC, monthsInRange } from "@/lib/calendar-range";
import { Modal } from "@/components/ui/Modal";
import { ImpactDrawer } from "@/components/ui/ImpactDrawer";
import { formatCents } from "@/lib/money";
import { previewRescheduleAction, applyRescheduleAction, type PreviewState } from "./actions";

const CAT_DOT: Record<string, string> = {
  work: "bg-cal-work", cash: "bg-cal-cash", content: "bg-cal-content", revenue: "bg-cal-revenue",
};

function Item({ item, onClick }: { item: CalendarItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11px] leading-tight text-paper-steel hover:bg-bg-gunmetal"
      title={item.title}
    >
      <span className={`h-2 w-2 shrink-0 rounded-sm ${CAT_DOT[item.category]}`} />
      <span className="truncate">{item.title}</span>
    </button>
  );
}

export function CalendarClient({
  view,
  anchorIso,
  items,
  canReschedule,
}: {
  view: CalendarView;
  anchorIso: string;
  items: CalendarItem[];
  canReschedule: boolean;
}) {
  const router = useRouter();
  const anchor = parseAnchor(anchorIso, new Date());

  const byDay = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    for (const it of items) {
      const list = m.get(it.date) ?? [];
      list.push(it);
      m.set(it.date, list);
    }
    return m;
  }, [items]);

  // ---- reschedule interaction state ----
  const [selected, setSelected] = useState<CalendarItem | null>(null);
  const [delta, setDelta] = useState(14);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewing, startPreview] = useTransition();
  const [applying, startApply] = useTransition();
  const [applyError, setApplyError] = useState<string>();

  const openPreview = () => {
    if (!selected?.taskId) return;
    startPreview(async () => {
      const res = await previewRescheduleAction(selected.taskId!, delta);
      setPreview(res);
      if (res.impact) { setDrawerOpen(true); setSelected(null); }
    });
  };
  const approve = () => {
    if (!preview?.taskId || preview.deltaDays == null) return;
    setApplyError(undefined);
    startApply(async () => {
      const res = await applyRescheduleAction(preview.taskId!, preview.deltaDays!);
      if (res.ok) { setDrawerOpen(false); setPreview(null); router.refresh(); }
      else setApplyError(res.error);
    });
  };

  return (
    <div>
      {view === "month" && <MonthGrid anchor={anchor} byDay={byDay} onSelect={setSelected} />}
      {view === "week" && <WeekGrid anchor={anchor} byDay={byDay} onSelect={setSelected} />}
      {view === "day" && <DayList anchor={anchor} byDay={byDay} onSelect={setSelected} />}
      {(view === "quarter" || view === "year" || view === "rolling12") && (
        <MonthSummary view={view} anchor={anchor} items={items} />
      )}

      {/* Event detail + reschedule form */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title ?? ""}>
        {selected && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="badge"><span className={`h-2 w-2 rounded-sm ${CAT_DOT[selected.category]}`} /> {selected.category}</span>
              <span className="badge">{selected.type}</span>
              <span className="badge">{selected.date}</span>
              {selected.vehicleLabel && <span className="badge">{selected.vehicleLabel}</span>}
            </div>
            {selected.amountCents != null && (
              <div className="text-sm text-paper-steel">Amount: <span className="tnum text-paper-warm">{formatCents(selected.amountCents)}</span></div>
            )}

            {canReschedule && selected.taskId ? (
              <div className="rounded border border-bg-gunmetal p-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-paper-muted">Reschedule linked task</div>
                <div className="flex items-end gap-2">
                  <div>
                    <label className="label" htmlFor="delta">Shift by (days)</label>
                    <input id="delta" type="number" className="input w-28" value={delta}
                      onChange={(e) => setDelta(parseInt(e.target.value || "0", 10))} />
                  </div>
                  <button className="btn" onClick={openPreview} disabled={previewing || delta === 0}>
                    {previewing ? "Calculating…" : "Preview Impact"}
                  </button>
                </div>
                {preview?.error && <p className="mt-2 text-sm text-status-critical">{preview.error}</p>}
                <p className="mt-2 text-xs text-paper-muted">Positive = later, negative = earlier. Downstream tasks and the four event dates cascade; you approve before anything saves.</p>
              </div>
            ) : canReschedule ? (
              <p className="text-xs text-paper-muted">This event isn&apos;t linked to a build task, so it has no dependency cascade.</p>
            ) : null}
          </div>
        )}
      </Modal>

      <ImpactDrawer
        open={drawerOpen}
        impact={preview?.impact ?? null}
        pending={applying}
        error={applyError}
        onApprove={approve}
        onModify={() => setDrawerOpen(false)}
        onCancel={() => { setDrawerOpen(false); setPreview(null); }}
      />
    </div>
  );
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function MonthGrid({ anchor, byDay, onSelect }: { anchor: Date; byDay: Map<string, CalendarItem[]>; onSelect: (i: CalendarItem) => void }) {
  const weeks = monthMatrix(anchor);
  const month = anchor.getUTCMonth();
  const todayIso = isoDay(new Date());
  return (
    <div className="overflow-hidden rounded-md border border-bg-gunmetal">
      <div className="grid grid-cols-7 border-b border-bg-gunmetal bg-bg-coal">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-paper-muted">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((day) => {
          const key = isoDay(day);
          const dayItems = byDay.get(key) ?? [];
          const outside = day.getUTCMonth() !== month;
          return (
            <div key={key} className={`min-h-[92px] border-b border-r border-bg-gunmetal p-1 ${outside ? "bg-bg-nearblack/40" : ""}`}>
              <div className={`mb-1 px-1 text-[11px] tnum ${key === todayIso ? "font-bold text-rust-400" : outside ? "text-paper-muted/40" : "text-paper-muted"}`}>
                {day.getUTCDate()}
              </div>
              <div className="space-y-0.5">
                {dayItems.slice(0, 4).map((it) => <Item key={it.key} item={it} onClick={() => onSelect(it)} />)}
                {dayItems.length > 4 && <div className="px-1 text-[10px] text-paper-muted">+{dayItems.length - 4} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({ anchor, byDay, onSelect }: { anchor: Date; byDay: Map<string, CalendarItem[]>; onSelect: (i: CalendarItem) => void }) {
  const { from } = computeRange("week", anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDaysUTC(from, i));
  const todayIso = isoDay(new Date());
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
      {days.map((day) => {
        const key = isoDay(day);
        const dayItems = byDay.get(key) ?? [];
        return (
          <div key={key} className="min-h-[140px] rounded-md border border-bg-gunmetal p-2">
            <div className={`mb-1.5 text-xs ${key === todayIso ? "font-bold text-rust-400" : "text-paper-muted"}`}>
              {day.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })} {day.getUTCDate()}
            </div>
            <div className="space-y-0.5">
              {dayItems.map((it) => <Item key={it.key} item={it} onClick={() => onSelect(it)} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayList({ anchor, byDay, onSelect }: { anchor: Date; byDay: Map<string, CalendarItem[]>; onSelect: (i: CalendarItem) => void }) {
  const key = isoDay(anchor);
  const dayItems = byDay.get(key) ?? [];
  return (
    <div className="panel p-4">
      {dayItems.length === 0 ? (
        <p className="text-sm text-paper-muted">Nothing scheduled on this day.</p>
      ) : (
        <ul className="divide-y divide-bg-gunmetal">
          {dayItems.map((it) => (
            <li key={it.key}>
              <button onClick={() => onSelect(it)} className="flex w-full items-center justify-between py-2 text-left hover:text-rust-400">
                <span className="flex items-center gap-2 text-sm text-paper-steel">
                  <span className={`h-2.5 w-2.5 rounded-sm ${CAT_DOT[it.category]}`} /> {it.title}
                </span>
                <span className="text-xs text-paper-muted">{it.category}{it.amountCents != null ? ` · ${formatCents(it.amountCents)}` : ""}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MonthSummary({ view, anchor, items }: { view: CalendarView; anchor: Date; items: CalendarItem[] }) {
  const months = monthsInRange(computeRange(view, anchor));
  const byMonthCat = new Map<string, Record<string, { n: number; cents: number }>>();
  for (const it of items) {
    const m = it.date.slice(0, 7);
    const rec = byMonthCat.get(m) ?? {};
    const c = rec[it.category] ?? { n: 0, cents: 0 };
    c.n += 1; c.cents += it.amountCents ?? 0;
    rec[it.category] = c;
    byMonthCat.set(m, rec);
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {months.map((m) => {
        const rec = byMonthCat.get(m) ?? {};
        const label = new Date(m + "-01T00:00:00Z").toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
        const total = Object.values(rec).reduce((s, c) => s + c.n, 0);
        return (
          <div key={m} className="panel p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-lg uppercase text-paper-warm">{label}</span>
              <span className="badge">{total}</span>
            </div>
            {total === 0 ? (
              <p className="text-xs text-paper-muted">No activity.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {(["work", "cash", "content", "revenue"] as const).map((cat) => {
                  const c = rec[cat];
                  if (!c) return null;
                  return (
                    <li key={cat} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-paper-steel">
                        <span className={`h-2 w-2 rounded-sm ${CAT_DOT[cat]}`} /> {cat}
                      </span>
                      <span className="tnum text-paper-muted">
                        {c.n}{c.cents ? ` · ${formatCents(c.cents)}` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
