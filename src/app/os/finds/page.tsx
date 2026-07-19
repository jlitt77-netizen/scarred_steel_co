import { requireAuthWithPermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { formatCents } from "@/lib/money";
import { PageHeader, Panel, MetricCard, StatusBadge, EmptyState } from "@/components/ui/primitives";
import { listFinds } from "@/server/services/programs";
import { AddFindButton, FindStageSelect } from "./FindsForms";

export default async function FindsPage() {
  const ctx = await requireAuthWithPermission("vehicle:read");
  const canWrite = can(ctx, "vehicle:write");
  const { finds, funnel, active, acquired, total } = await listFinds(ctx);
  const maxFunnel = Math.max(1, ...funnel.map((b) => b.count));

  return (
    <div>
      <PageHeader
        eyebrow="Program"
        title="Scarred Steel Finds"
        subtitle="Public vehicle submissions feeding the acquisition pipeline — New → Saved → Contacted → Evaluating → Acquired."
        actions={canWrite ? <AddFindButton /> : undefined}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Total Finds" value={total} accent="vehicle" />
        <MetricCard label="Active Pipeline" value={active} tone={active > 0 ? "attention" : "healthy"} />
        <MetricCard label="Acquired" value={acquired} tone="healthy" />
        <MetricCard label="Rejected" value={funnel.find((b) => b.stage === "Rejected")?.count ?? 0} />
      </div>

      <Panel className="mt-6" title="Acquisition Pipeline" accent="vehicle">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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

      <Panel className="mt-6" title="Finds">
        {finds.length === 0 ? (
          <EmptyState title="No finds yet" description="Log a submission to start the acquisition pipeline." />
        ) : (
          <div className="scroll-steel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Vehicle</th><th>Location</th><th className="num">Asking</th><th>Value Path</th><th>Submitter</th><th>Stage</th></tr>
              </thead>
              <tbody>
                {finds.map((f) => (
                  <tr key={f.id}>
                    <td className="text-paper-warm">{f.vehicleDesc}</td>
                    <td className="text-paper-muted">{f.location ?? "—"}</td>
                    <td className="num">{f.askingPriceCents != null ? formatCents(f.askingPriceCents) : "—"}</td>
                    <td className="text-paper-muted">{f.valuePath ?? "—"}</td>
                    <td className="text-paper-muted">{f.submitterName ?? "—"}</td>
                    <td>{canWrite ? <FindStageSelect id={f.id} stage={f.stage} /> : <StatusBadge status={f.stage} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="mt-4 text-xs text-paper-muted">
        Finds move through the pipeline toward an acquire or reject decision; acquired finds feed the
        Vehicle Portfolio. Value paths capture how a lead pays off even when we don&apos;t buy it —
        content, referral, brokerage, or marketplace.
      </p>
    </div>
  );
}
