import { requireAuthWithPermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { formatCents } from "@/lib/money";
import { PageHeader, Panel, MetricCard, StatusBadge, EmptyState } from "@/components/ui/primitives";
import { listSponsors, listDeliverables, getSponsorSummary, listSponsorsForSelect } from "@/server/services/sponsors";
import { listEpisodesForSelect } from "@/server/services/media";
import { AddSponsorButton, AddDeliverableButton, DeliverableStatusSelect } from "./SponsorForms";

function fmtDate(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "—";
}

export default async function SponsorsPage() {
  const ctx = await requireAuthWithPermission("sponsor:read");
  const canWrite = can(ctx, "sponsor:write");

  const [summary, sponsors, deliverables] = await Promise.all([
    getSponsorSummary(ctx), listSponsors(ctx), listDeliverables(ctx),
  ]);
  const canMedia = can(ctx, "media:read");
  const [sponsorOpts, episodeOpts] = canWrite
    ? await Promise.all([
        listSponsorsForSelect(ctx),
        canMedia ? listEpisodesForSelect(ctx) : Promise.resolve([]),
      ])
    : [[], []];
  const episodes = episodeOpts.map((e) => ({ id: e.id, name: e.title }));

  const maxFunnel = Math.max(1, ...summary.funnel.map((b) => b.count));

  return (
    <div>
      <PageHeader
        eyebrow="Partnerships"
        title="Sponsorship & Partnership CRM"
        subtitle="Pipeline, deal value, deliverables, approvals, and renewals — feeding the calendar and dashboard."
        actions={canWrite ? (
          <div className="flex gap-2">
            <AddDeliverableButton sponsors={sponsorOpts} episodes={episodes} />
            <AddSponsorButton />
          </div>
        ) : undefined}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Active Sponsors" value={summary.activeSponsors} accent="sponsor" hint={`${summary.sponsorCount} in pipeline`} />
        <MetricCard label="Active Value / yr" value={formatCents(summary.activeValueCents)} accent="financial" />
        <MetricCard
          label="Deliverables Due"
          value={summary.due.overdue + summary.due.dueSoon}
          tone={summary.due.overdue > 0 ? "risk" : summary.due.dueSoon > 0 ? "attention" : "healthy"}
          hint={summary.due.overdue > 0 ? `${summary.due.overdue} overdue` : "next 14 days"}
        />
        <MetricCard label="Renewals (60d)" value={summary.renewalsDue} tone={summary.renewalsDue > 0 ? "attention" : "healthy"} />
      </div>

      {/* Pipeline funnel */}
      <Panel className="mt-6" title="Sales Pipeline" accent="sponsor">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {summary.funnel.map((b) => (
            <div key={b.stage} className="panel p-3">
              <div className="text-[11px] uppercase tracking-wide text-paper-muted">{b.stage}</div>
              <div className="tnum mt-0.5 font-display text-2xl text-paper-warm">{b.count}</div>
              <div className="text-[11px] text-paper-muted">{b.valueCents ? formatCents(b.valueCents) : "—"}</div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-gunmetal">
                <div className="h-full rounded-full bg-amber" style={{ width: `${Math.round((b.count / maxFunnel) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Sponsors */}
      <Panel className="mt-6" title="Sponsors">
        {sponsors.length === 0 ? (
          <EmptyState title="No sponsors yet" description="Add your first prospect to start tracking the pipeline, deal value, and deliverables." />
        ) : (
          <div className="scroll-steel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th><th>Stage</th><th>Level</th><th>Exclusive</th>
                  <th className="num">Value / yr</th><th className="num">Deliverables</th><th>Renewal</th>
                </tr>
              </thead>
              <tbody>
                {sponsors.map((s) => (
                  <tr key={s.id}>
                    <td className="text-paper-warm">{s.name}{s.contactName && <span className="ml-2 text-xs text-paper-muted">{s.contactName}</span>}</td>
                    <td><StatusBadge status={s.stage} /></td>
                    <td className="text-paper-muted">{s.level ?? "—"}</td>
                    <td className="text-paper-muted">{s.exclusive ? (s.exclusiveCategory ?? "Yes") : "—"}</td>
                    <td className="num text-paper-warm">{formatCents(s.totalValueCents)}</td>
                    <td className="num">
                      {s.openDeliverables || "—"}
                      {s.overdueDeliverables > 0 && <span className="ml-1 text-status-critical">({s.overdueDeliverables} od)</span>}
                    </td>
                    <td className="text-paper-muted">{fmtDate(s.renewalDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Deliverables */}
      <Panel className="mt-6" title="Deliverables">
        {deliverables.length === 0 ? (
          <p className="text-sm text-paper-muted">No deliverables yet.</p>
        ) : (
          <div className="scroll-steel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Deliverable</th><th>Sponsor</th><th>Type</th><th>Due</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {deliverables.map((d) => (
                  <tr key={d.id}>
                    <td className="text-paper-warm">{d.title}</td>
                    <td className="text-paper-muted">{d.sponsorName ?? "—"}</td>
                    <td className="text-paper-steel">{d.type}</td>
                    <td className={d.overdue ? "text-status-critical" : "text-paper-muted"}>
                      {fmtDate(d.dueDate)}{d.overdue ? " · overdue" : ""}
                    </td>
                    <td>{canWrite ? <DeliverableStatusSelect id={d.id} status={d.status} /> : <StatusBadge status={d.status} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="mt-4 text-xs text-paper-muted">
        Deal value blends annual cash and in-kind product; discount and affiliate commission are tracked
        per sponsor. Deliverable due dates flow to the Master Calendar and the CEO dashboard, and their
        sponsor-review step ties into the social publishing pipeline.
      </p>
    </div>
  );
}
