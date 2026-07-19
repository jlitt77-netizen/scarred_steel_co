import { requireAuthWithPermission } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { PageHeader, Panel } from "@/components/ui/primitives";
import { getCommunityFeed } from "@/server/services/portal";

function fmtDate(d: Date | null | undefined) {
  return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : "";
}

export default async function CommunityPortalPage() {
  const ctx = await requireAuthWithPermission("portal:fan");
  const { builds, episodes, drops, releases, forSale, finds, rescues } = await getCommunityFeed(ctx);

  return (
    <div>
      <PageHeader
        eyebrow="Fan / Community"
        title="Built, Not Broken"
        subtitle="Follow the builds, the stories, and the steel. Episodes, drops, and rescues as they happen."
        textured={false}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Active Builds" accent="vehicle">
          {builds.length === 0 ? <p className="text-sm text-paper-muted">No active builds right now.</p> : (
            <div className="space-y-2">
              {builds.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded border border-bg-gunmetal px-3 py-2">
                  <span className="text-paper-warm">{b.year} {b.make} {b.model}{b.nickname ? ` “${b.nickname}”` : ""}</span>
                  <span className="text-xs text-paper-muted">Active Build</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Latest Episodes" accent="media">
          {episodes.length === 0 ? <p className="text-sm text-paper-muted">No episodes published yet.</p> : (
            <div className="space-y-2">
              {episodes.map((e, i) => (
                <div key={i} className="flex items-center justify-between rounded border border-bg-gunmetal px-3 py-2">
                  <span className="text-paper-warm">{e.youtubeUrl ? <a href={e.youtubeUrl} target="_blank" rel="noreferrer" className="hover:text-rust-400">{e.title}</a> : e.title}</span>
                  <span className="text-xs text-paper-muted">{fmtDate(e.publishedDate)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Merch Drops" accent="sponsor">
          {drops.length === 0 ? <p className="text-sm text-paper-muted">No drops scheduled.</p> : (
            <div className="space-y-2">
              {drops.map((d, i) => (
                <div key={i} className="flex items-center justify-between rounded border border-bg-gunmetal px-3 py-2">
                  <span className="text-paper-warm">{d.name}</span>
                  <span className="text-xs text-paper-muted">{d.retailCents ? formatCents(d.retailCents) : ""} {d.dropDate ? `· ${fmtDate(d.dropDate)}` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Blueprint Releases">
          {releases.length === 0 ? <p className="text-sm text-paper-muted">No releases yet.</p> : (
            <div className="space-y-2">
              {releases.map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded border border-bg-gunmetal px-3 py-2">
                  <span className="text-paper-warm">{r.name}</span>
                  <span className="text-xs text-paper-muted">{r.type}{r.priceCents ? ` · ${formatCents(r.priceCents)}` : " · Free"}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="For Sale">
          {forSale.length === 0 ? <p className="text-sm text-paper-muted">Nothing listed right now.</p> : (
            <div className="space-y-2">
              {forSale.map((v, i) => (
                <div key={i} className="flex items-center justify-between rounded border border-bg-gunmetal px-3 py-2">
                  <span className="text-paper-warm">{v.year} {v.make} {v.model}</span>
                  <span className="text-xs text-paper-muted">{v.targetSalePriceCents ? formatCents(v.targetSalePriceCents) : "Inquire"}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Finds & Rescues" accent="vehicle">
          <div className="space-y-2">
            {finds.map((f, i) => (
              <div key={`f${i}`} className="flex items-center justify-between rounded border border-bg-gunmetal px-3 py-2">
                <span className="text-paper-warm">{f.vehicleDesc}</span>
                <span className="text-xs text-paper-muted">{f.location ? `${f.location} · ` : ""}{f.stage}</span>
              </div>
            ))}
            {rescues.map((r, i) => (
              <div key={`r${i}`} className="flex items-center justify-between rounded border border-bg-gunmetal px-3 py-2">
                <span className="text-paper-warm">🔧 {r.title}</span>
                <span className="text-xs text-paper-muted">{r.outcome ?? r.stage}</span>
              </div>
            ))}
            {finds.length === 0 && rescues.length === 0 && <p className="text-sm text-paper-muted">No finds or rescues yet.</p>}
          </div>
        </Panel>
      </div>

      <p className="mt-6 text-xs text-paper-muted">
        Everything here is public. Follow a build to get episode alerts and progress photos as the steel comes together.
      </p>
    </div>
  );
}
