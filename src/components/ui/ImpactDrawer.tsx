"use client";

import { useEffect } from "react";
import type { ImpactPreview } from "@/server/scheduling/impact";
import { formatCents } from "@/lib/money";
import { IconAlert, IconCheck } from "@/components/ui/icons";

// Reschedule Impact Preview (Section 5 & 14). Shows SCHEDULE / RESOURCE /
// FINANCIAL / CONTENT / REVENUE / SPONSOR effects before anything is saved, with
// Approve / Modify / Cancel. Nothing important moves silently.

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="border-t border-bg-gunmetal py-3">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-paper-muted">{title}</h3>
        {count != null && <span className="badge">{count}</span>}
      </div>
      {children}
    </div>
  );
}

export function ImpactDrawer({
  open,
  impact,
  pending,
  error,
  onApprove,
  onModify,
  onCancel,
}: {
  open: boolean;
  impact: ImpactPreview | null;
  pending: boolean;
  error?: string;
  onApprove: () => void;
  onModify: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open || !impact) return null;
  const c = impact.counts;
  const dir = impact.deltaDays >= 0 ? "later" : "earlier";
  const fin = impact.financial;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={onCancel} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Reschedule impact preview"
        className="scroll-steel absolute right-0 top-0 flex h-full w-full max-w-md animate-slide-in-right flex-col overflow-y-auto border-l border-bg-panel bg-bg-charcoal shadow-drawer"
      >
        <div className="surface-texture border-b border-bg-gunmetal p-5">
          <h2 className="font-display text-2xl uppercase text-paper-warm">Impact Preview</h2>
          <p className="mt-1 text-sm text-paper-muted">
            Moving {Math.abs(impact.deltaDays)} day(s) {dir} affects{" "}
            <span className="text-paper-steel">{c.downstreamTasks} downstream task(s)</span> and{" "}
            <span className="text-paper-steel">{impact.eventShifts.length} event(s)</span>. Nothing is
            saved until you approve.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {c.cameraSessions > 0 && <span className="badge">{c.cameraSessions} camera</span>}
            {c.editingAssignments > 0 && <span className="badge">{c.editingAssignments} editing</span>}
            {c.contentPublishes > 0 && <span className="badge">{c.contentPublishes} content</span>}
            {c.socialPosts > 0 && <span className="badge">{c.socialPosts} social</span>}
            {c.sponsorDeliverables > 0 && <span className="badge text-amber">{c.sponsorDeliverables} sponsor</span>}
            {c.milestones > 0 && <span className="badge text-brass">{c.milestones} milestone</span>}
          </div>
        </div>

        <div className="flex-1 px-5">
          <Section title="Schedule" count={impact.taskShifts.length}>
            <ul className="space-y-1.5">
              {impact.taskShifts.map((s) => (
                <li key={s.taskId} className="flex items-center justify-between text-sm">
                  <span className="truncate text-paper-steel">{s.title}</span>
                  <span className="ml-2 shrink-0 text-xs text-paper-muted">
                    {fmtDate(s.oldStart)} <span className="text-cal-work">→</span> {fmtDate(s.newStart)}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          {impact.resourceConflicts.length > 0 && (
            <Section title="Resource Conflicts" count={impact.resourceConflicts.length}>
              <ul className="space-y-1">
                {impact.resourceConflicts.map((rc, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-status-risk">
                    <IconAlert className="mt-0.5 shrink-0" />
                    <span>&ldquo;{rc.aTitle}&rdquo; overlaps &ldquo;{rc.bTitle}&rdquo; (same owner)</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Financial (cash timing)">
            {fin.deferredCashCents > 0 && (
              <p className="mb-2 text-sm text-cal-cash">
                {formatCents(fin.deferredCashCents)} in cash outflow deferred.
              </p>
            )}
            {fin.cashMonthDeltas.length === 0 ? (
              <p className="text-sm text-paper-muted">No cross-month cash movement.</p>
            ) : (
              <ul className="space-y-1">
                {fin.cashMonthDeltas.map((m) => (
                  <li key={m.month} className="flex justify-between text-sm">
                    <span className="text-paper-muted">{m.month}</span>
                    <span className={`tnum ${m.deltaCents >= 0 ? "text-status-gain" : "text-status-loss"}`}>
                      {m.deltaCents >= 0 ? "+" : ""}{formatCents(m.deltaCents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Revenue timing">
            {fin.deferredRevenueCents > 0 ? (
              <p className="text-sm text-brass">
                {formatCents(fin.deferredRevenueCents)} in expected revenue shifts {dir}.
              </p>
            ) : (
              <p className="text-sm text-paper-muted">No revenue timing change.</p>
            )}
            {fin.revenueMonthDeltas.map((m) => (
              <div key={m.month} className="mt-1 flex justify-between text-sm">
                <span className="text-paper-muted">{m.month}</span>
                <span className={`tnum ${m.deltaCents >= 0 ? "text-status-gain" : "text-status-loss"}`}>
                  {m.deltaCents >= 0 ? "+" : ""}{formatCents(m.deltaCents)}
                </span>
              </div>
            ))}
          </Section>

          {(impact.sponsorDeliverableTitles.length > 0 || impact.milestoneTitles.length > 0) && (
            <Section title="Sponsor & Milestones">
              {impact.sponsorDeliverableTitles.map((t) => (
                <div key={t} className="text-sm text-amber">Sponsor deliverable: {t}</div>
              ))}
              {impact.milestoneTitles.map((t) => (
                <div key={t} className="text-sm text-brass">Milestone: {t}</div>
              ))}
            </Section>
          )}

          {error && (
            <p className="my-3 rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">
              {error}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-bg-gunmetal bg-bg-charcoal p-4">
          <button className="btn flex-1" onClick={onApprove} disabled={pending}>
            <IconCheck /> {pending ? "Applying…" : "Approve Changes"}
          </button>
          <button className="btn-secondary" onClick={onModify} disabled={pending}>Modify</button>
          <button className="btn-ghost" onClick={onCancel} disabled={pending}>Cancel</button>
        </div>
      </aside>
    </div>
  );
}
