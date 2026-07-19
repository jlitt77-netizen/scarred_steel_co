import { requireAuthWithPermission } from "@/lib/auth";
import { PageHeader, Panel, MetricCard, StatusBadge, EmptyState } from "@/components/ui/primitives";
import { getMySponsorship } from "@/server/services/portal";
import { DeliverableDecision } from "./DeliverableActions";

function fmtDate(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "—";
}

export default async function SponsorPortalPage() {
  const ctx = await requireAuthWithPermission("portal:sponsor");
  const data = await getMySponsorship(ctx);

  if (!data) {
    return (
      <div>
        <PageHeader eyebrow="Sponsor Portal" title="Sponsor Portal" textured={false} />
        <EmptyState title="No partnership linked yet" description="Once your partnership is set up, your deliverables and content performance will appear here." />
      </div>
    );
  }

  const { sponsor, deliverables, posts } = data;
  const awaiting = deliverables.filter((d) => d.status === "Submitted" || d.status === "Sponsor Review").length;
  const published = posts.filter((p) => p.status === "Published").length;

  return (
    <div>
      <PageHeader
        eyebrow="Sponsor Portal"
        title={sponsor.name}
        subtitle={`${sponsor.level ?? "Partner"}${sponsor.exclusive ? ` · exclusive${sponsor.exclusiveCategory ? ` (${sponsor.exclusiveCategory})` : ""}` : ""}`}
        textured={false}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Deliverables" value={deliverables.length} accent="sponsor" />
        <MetricCard label="Awaiting Your Review" value={awaiting} tone={awaiting > 0 ? "attention" : "healthy"} />
        <MetricCard label="Published Content" value={published} tone="healthy" />
        <MetricCard label="Renewal" value={fmtDate(sponsor.renewalDate)} hint={sponsor.contractEnd ? `contract ends ${fmtDate(sponsor.contractEnd)}` : undefined} />
      </div>

      <Panel className="mt-6" title="Deliverables">
        {deliverables.length === 0 ? (
          <p className="text-sm text-paper-muted">No deliverables yet.</p>
        ) : (
          <div className="space-y-2">
            {deliverables.map((d) => {
              const awaitingReview = d.status === "Submitted" || d.status === "Sponsor Review";
              return (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-bg-gunmetal bg-bg-charcoal/40 px-3 py-2">
                  <div>
                    <div className="text-paper-warm">{d.title}</div>
                    <div className="text-xs text-paper-muted">{d.type} · due {fmtDate(d.dueDate)}</div>
                  </div>
                  {awaitingReview ? <DeliverableDecision id={d.id} /> : <StatusBadge status={d.status} />}
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel className="mt-6" title="Content Performance">
        {posts.length === 0 ? (
          <p className="text-sm text-paper-muted">No published content yet.</p>
        ) : (
          <div className="scroll-steel overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Post</th><th>Platform</th><th>Status</th><th>Published</th></tr></thead>
              <tbody>
                {posts.map((p, i) => (
                  <tr key={i}>
                    <td className="text-paper-warm">{p.title}</td>
                    <td className="text-paper-steel">{p.platform}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="text-paper-muted">{fmtDate(p.publishedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="mt-4 text-xs text-paper-muted">
        Approving a deliverable updates the internal production schedule. Your partnership&apos;s
        financial terms are private — this portal never shows deal values or internal margins.
      </p>
    </div>
  );
}
