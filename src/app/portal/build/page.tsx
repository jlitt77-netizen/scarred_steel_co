import { requireAuthWithPermission } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { PageHeader, Panel, MetricCard, StatusBadge, EmptyState, ProgressBar } from "@/components/ui/primitives";
import { getMyBuild } from "@/server/services/portal";
import { ChangeOrderDecision } from "./ChangeOrderActions";

function fmtDate(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "—";
}

export default async function MyBuildPage() {
  const ctx = await requireAuthWithPermission("portal:customer");
  const data = await getMyBuild(ctx);

  if (!data) {
    return (
      <div>
        <PageHeader eyebrow="My Build" title="My Build" subtitle="Your build hub." textured={false} />
        <EmptyState title="No build linked yet" description="Once your build is set up, it'll appear here with progress, photos, and payments." />
      </div>
    );
  }

  const { vehicle, project, phases, changeOrders, photos, financials } = data;
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.nickname ? ` “${vehicle.nickname}”` : ""}`;

  return (
    <div>
      <PageHeader eyebrow="My Build" title={title} subtitle={project ? `${project.status} · ${project.percentComplete}% complete` : vehicle.status} textured={false} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Contract" value={formatCents(financials.contractCents)} accent="financial" />
        <MetricCard label="Approved Changes" value={formatCents(financials.approvedChangeOrdersCents)} />
        <MetricCard label="Paid to Date" value={formatCents(financials.paidCents)} tone="healthy" />
        <MetricCard label="Balance Due" value={formatCents(financials.balanceDueCents)} tone={financials.balanceDueCents > 0 ? "attention" : "healthy"} />
      </div>

      {project && (
        <Panel className="mt-6" title="Progress" accent="vehicle">
          <div className="mb-4 max-w-md">
            <div className="mb-1 flex justify-between text-xs text-paper-muted"><span>Overall completion</span><span className="tnum">{project.percentComplete}%</span></div>
            <ProgressBar value={project.percentComplete} />
            <p className="mt-2 text-xs text-paper-muted">Target: {fmtDate(project.plannedStart)} → {fmtDate(project.plannedEnd)}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {phases.map((p) => (
              <div key={p.name} className="rounded border border-bg-gunmetal px-3 py-2">
                <div className="text-sm text-paper-warm">{p.name}</div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Change orders needing a decision */}
      {changeOrders.length > 0 && (
        <Panel className="mt-6" title="Change Orders">
          <div className="space-y-2">
            {changeOrders.map((co) => (
              <div key={co.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-bg-gunmetal bg-bg-charcoal/40 px-3 py-2">
                <div>
                  <div className="text-paper-warm">{co.title}{co.amountCents != null && <span className="ml-2 text-status-attention">{formatCents(co.amountCents)}</span>}</div>
                  {co.description && <div className="text-xs text-paper-muted">{co.description}</div>}
                </div>
                {co.status === "proposed"
                  ? <ChangeOrderDecision id={co.id} />
                  : <StatusBadge status={co.status} />}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-paper-muted">Approving a change order updates the internal build schedule and forecast automatically.</p>
        </Panel>
      )}

      {/* Photos */}
      <Panel className="mt-6" title="Build Photos">
        {photos.length === 0 ? (
          <p className="text-sm text-paper-muted">No photos posted yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((ph, i) => (
              <figure key={i} className="overflow-hidden rounded border border-bg-gunmetal">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ph.url} alt={ph.caption ?? "Build photo"} className="h-32 w-full bg-bg-charcoal object-cover" />
                {ph.caption && <figcaption className="px-2 py-1 text-xs text-paper-muted">{ph.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
