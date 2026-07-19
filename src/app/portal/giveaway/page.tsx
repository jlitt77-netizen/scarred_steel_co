import { requireAuthWithPermission } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { PageHeader, Panel, StatusBadge, EmptyState } from "@/components/ui/primitives";
import { getPublicGiveaways } from "@/server/services/portal";

function fmtDate(d: Date | null | undefined) {
  return d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : "TBA";
}

export default async function GiveawayPortalPage() {
  const ctx = await requireAuthWithPermission("portal:giveaway");
  const giveaways = await getPublicGiveaways(ctx);

  return (
    <div>
      <PageHeader
        eyebrow="Giveaways"
        title="Scarred Steel Giveaways"
        subtitle="Enter to win. Every giveaway runs under official rules — here's what's live."
        textured={false}
      />

      {giveaways.length === 0 ? (
        <EmptyState title="No active giveaways" description="Check back soon — new giveaways drop with each major build." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {giveaways.map((g) => (
            <Panel key={g.id} title={g.name} accent="sponsor">
              <div className="mb-3 flex items-center gap-2">
                <StatusBadge status={g.status} />
                {g.status === "Live" && <span className="text-xs text-status-healthy">Open for entry</span>}
              </div>
              {g.prizeDescription && <p className="text-lg text-paper-warm">{g.prizeDescription}</p>}
              {g.prizeValueCents != null && <p className="text-sm text-paper-muted">Approx. retail value {formatCents(g.prizeValueCents)}</p>}

              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded border border-bg-gunmetal px-2 py-2"><div className="text-paper-muted">Opens</div><div className="text-paper-warm">{fmtDate(g.launchDate)}</div></div>
                <div className="rounded border border-bg-gunmetal px-2 py-2"><div className="text-paper-muted">Closes</div><div className="text-paper-warm">{fmtDate(g.endDate)}</div></div>
                <div className="rounded border border-bg-gunmetal px-2 py-2"><div className="text-paper-muted">Draw</div><div className="text-paper-warm">{fmtDate(g.drawDate)}</div></div>
              </div>

              {g.status === "Complete" ? (
                <p className="mt-3 text-sm text-status-gain">Winner: {g.winnerName ?? "announced soon"}</p>
              ) : (
                <div className="mt-4">
                  <button className="btn w-full" disabled>Enter (opens {fmtDate(g.launchDate)})</button>
                  <p className="mt-2 text-xs text-paper-muted">No purchase necessary. Void where prohibited. See official rules & eligibility for full details.</p>
                </div>
              )}
            </Panel>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-paper-muted">
        Official rules, eligibility, and entry details govern every giveaway. Winner selection and
        verification follow those rules; the internal compliance process stays private.
      </p>
    </div>
  );
}
