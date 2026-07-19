import { requireAuthWithPermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { formatCents } from "@/lib/money";
import { PageHeader, Panel, MetricCard, StatusBadge, EmptyState, ProgressBar } from "@/components/ui/primitives";
import { listGiveaways, getGiveawaySummary } from "@/server/services/giveaways";
import { listVehiclesForSelect } from "@/server/services/fleet";
import { LAUNCH_GATES } from "@/server/giveaways/compliance";
import { AddGiveawayButton, GateToggle, LaunchButton } from "./GiveawayForms";

function fmtDate(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "—";
}

export default async function GiveawaysPage() {
  const ctx = await requireAuthWithPermission("giveaway:read");
  const canWrite = can(ctx, "giveaway:write");
  const canVehicles = can(ctx, "vehicle:read");

  const [summary, giveaways] = await Promise.all([getGiveawaySummary(ctx), listGiveaways(ctx)]);
  const vehicles = canWrite && canVehicles ? await listVehiclesForSelect(ctx) : [];

  return (
    <div>
      <PageHeader
        eyebrow="Program · Compliance"
        title="Giveaway Planning & Compliance"
        subtitle="LAUNCH BLOCKED until attorney review, rules, eligibility, tax, and funding all pass."
        actions={canWrite ? <AddGiveawayButton vehicles={vehicles} /> : undefined}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Giveaways" value={summary.count} accent="sponsor" />
        <MetricCard label="Live" value={summary.live} tone={summary.live > 0 ? "healthy" : undefined} />
        <MetricCard label="Launch Blocked" value={summary.blocked} tone={summary.blocked > 0 ? "risk" : "healthy"} />
        <MetricCard label="Prize Value" value={formatCents(summary.prizeValueCents)} accent="financial" />
      </div>

      {giveaways.length === 0 ? (
        <div className="mt-6"><EmptyState title="No giveaways yet" description="Plan a giveaway — it stays launch-blocked until every compliance gate is cleared." /></div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {giveaways.map((g) => {
            const pct = Math.round((g.readiness.passedCount / g.readiness.totalGates) * 100);
            const isLive = g.status === "Live";
            return (
              <Panel key={g.id} title={g.name} accent={g.readiness.launchReady || isLive ? "financial" : "risk"}>
                <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-paper-muted">
                  <StatusBadge status={g.status} />
                  <span>Stage: {g.stage}</span>
                  {g.prizeValueCents != null && <span>{formatCents(g.prizeValueCents)} prize</span>}
                  {g.prizeDescription && <span className="text-paper-steel">{g.prizeDescription}</span>}
                </div>

                {/* Compliance gates */}
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className={`font-semibold uppercase tracking-wide ${g.readiness.launchReady || isLive ? "text-status-healthy" : "text-status-critical"}`}>
                    {isLive ? "LIVE" : g.readiness.launchReady ? "READY TO LAUNCH" : "LAUNCH BLOCKED"}
                  </span>
                  <span className="tnum text-paper-muted">{g.readiness.passedCount}/{g.readiness.totalGates} gates</span>
                </div>
                <ProgressBar value={pct} className="mb-3" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {LAUNCH_GATES.map((gate) => (
                    <GateToggle key={gate.key} id={g.id} gate={gate.key} label={gate.label} checked={!!g[gate.key]} disabled={!canWrite || isLive} />
                  ))}
                </div>

                {/* Dates */}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-paper-muted">
                  <span>Launch: {fmtDate(g.launchDate)}</span>
                  <span>Draw: {fmtDate(g.drawDate)}</span>
                  <span>Ends: {fmtDate(g.endDate)}</span>
                </div>

                {/* Fulfillment (post-launch) */}
                {(isLive || g.status === "Complete") && (
                  <div className="mt-3 border-t border-bg-gunmetal pt-3">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-paper-muted">Winner fulfillment</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      {g.fulfillment.map((s) => (
                        <span key={s.key} className={s.done ? "text-status-healthy" : "text-paper-muted"}>{s.done ? "✓" : "○"} {s.label}</span>
                      ))}
                    </div>
                  </div>
                )}

                {canWrite && !isLive && g.status !== "Complete" && (
                  <div className="mt-4"><LaunchButton id={g.id} ready={g.readiness.launchReady} /></div>
                )}
              </Panel>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-xs text-paper-muted">
        Every gate — attorney review, official rules, eligibility, tax plan, and prize funding — must pass
        before a giveaway can go live; the Launch action refuses otherwise. Launch, draw, and end dates
        appear on the Master Calendar.
      </p>
    </div>
  );
}
