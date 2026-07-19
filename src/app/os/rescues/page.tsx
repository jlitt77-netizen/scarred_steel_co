import { requireAuthWithPermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, Panel, MetricCard, StatusBadge, EmptyState } from "@/components/ui/primitives";
import { listRescues } from "@/server/services/programs";
import { AddRescueButton, RescueStageSelect } from "./RescuesForms";

export default async function RescuesPage() {
  const ctx = await requireAuthWithPermission("vehicle:read");
  const canWrite = can(ctx, "vehicle:write");
  const { rescues, funnel, outcomes, active, total } = await listRescues(ctx);
  const maxFunnel = Math.max(1, ...funnel.map((b) => b.count));

  return (
    <div>
      <PageHeader
        eyebrow="Program"
        title="Scarred Steel Rescues"
        subtitle="Find → Rescue → Revive → Decide — a content engine and an acquisition engine in one."
        actions={canWrite ? <AddRescueButton /> : undefined}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Total Rescues" value={total} accent="vehicle" />
        <MetricCard label="Active" value={active} tone={active > 0 ? "attention" : "healthy"} />
        <MetricCard label="Completed" value={funnel.find((b) => b.stage === "Complete")?.count ?? 0} tone="healthy" />
        <MetricCard label="Decided Outcomes" value={outcomes.reduce((s, o) => s + o.count, 0)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Rescue Pipeline" accent="vehicle">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {funnel.map((b) => (
              <div key={b.stage} className="panel p-3">
                <div className="text-[11px] uppercase tracking-wide text-paper-muted">{b.stage}</div>
                <div className="tnum mt-0.5 font-display text-2xl text-paper-warm">{b.count}</div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-gunmetal">
                  <div className="h-full rounded-full bg-patina" style={{ width: `${Math.round((b.count / maxFunnel) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Outcomes">
          {outcomes.every((o) => o.count === 0) ? (
            <p className="text-sm text-paper-muted">No decisions recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {outcomes.map((o) => (
                <div key={o.stage} className="flex items-center justify-between text-sm">
                  <span className="text-paper-steel">{o.stage}</span>
                  <span className="tnum text-paper-warm">{o.count}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel className="mt-6" title="Rescues">
        {rescues.length === 0 ? (
          <EmptyState title="No rescues yet" description="Log a rescue to run it from find to decision." />
        ) : (
          <div className="scroll-steel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Title</th><th>Vehicle</th><th>Location</th><th>Outcome</th><th>Stage</th></tr>
              </thead>
              <tbody>
                {rescues.map((r) => (
                  <tr key={r.id}>
                    <td className="text-paper-warm">{r.title}</td>
                    <td className="text-paper-muted">{r.vehicleDesc ?? "—"}</td>
                    <td className="text-paper-muted">{r.location ?? "—"}</td>
                    <td className="text-paper-steel">{r.outcome ?? "—"}</td>
                    <td>{canWrite ? <RescueStageSelect id={r.id} stage={r.stage} /> : <StatusBadge status={r.stage} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="mt-4 text-xs text-paper-muted">
        Each rescue is both a story and a potential acquisition. Outcomes — build, sell, giveaway, keep,
        or pass along — decide where the vehicle goes; content links tie it to an episode series.
      </p>
    </div>
  );
}
