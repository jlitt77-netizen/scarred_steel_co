import { requireAuthWithPermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { PageHeader, Panel, MetricCard, StatusBadge, EmptyState } from "@/components/ui/primitives";
import { listSeries, listEpisodes, getMediaSummary, listEpisodesForSelect, listSeriesForSelect } from "@/server/services/media";
import { AddSeriesButton, AddEpisodeButton, AddRevenueButton } from "./MediaForms";

function fmtDate(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "—";
}

export default async function MediaPage() {
  const ctx = await requireAuthWithPermission("media:read");
  const canWrite = can(ctx, "media:write");

  const [summary, series, episodes] = await Promise.all([
    getMediaSummary(ctx), listSeries(ctx), listEpisodes(ctx),
  ]);
  const [vehicleRows, seriesOpts, episodeOpts] = canWrite
    ? await Promise.all([
        prisma.vehicle.findMany({ select: { id: true, year: true, make: true, model: true }, orderBy: { year: "asc" } }),
        listSeriesForSelect(ctx),
        listEpisodesForSelect(ctx),
      ])
    : [[], [], []];
  const vehicles = vehicleRows.map((v) => ({ id: v.id, label: `${v.year} ${v.make} ${v.model}` }));

  const maxFunnel = Math.max(1, ...summary.funnel.map((b) => b.count));

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Media & Content"
        subtitle="Every major build as a content series — concept to publish, production cost, and attributed revenue."
        actions={canWrite ? (
          <div className="flex gap-2">
            <AddSeriesButton vehicles={vehicles} />
            <AddRevenueButton episodes={episodeOpts.map((e) => ({ id: e.id, name: e.title }))} />
            <AddEpisodeButton vehicles={vehicles} series={seriesOpts} />
          </div>
        ) : undefined}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Episodes" value={summary.episodeCount} accent="media" hint={`${summary.publishedCount} published · ${summary.inProductionCount} in production`} />
        <MetricCard label="Production Cost" value={formatCents(summary.productionCostCents)} accent="vehicle" />
        <MetricCard label="Attributed Revenue" value={formatCents(summary.revenueCents)} accent="financial" />
        <MetricCard label="Net · ROI" value={formatCents(summary.netCents)} tone={summary.netCents >= 0 ? "healthy" : "risk"} hint={`${summary.roiPct}% ROI`} />
      </div>

      {/* Production pipeline funnel */}
      <Panel className="mt-6" title="Production Pipeline" accent="media">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {summary.funnel.map((b) => (
            <div key={b.stage} className="panel p-3">
              <div className="text-[11px] uppercase tracking-wide text-paper-muted">{b.stage}</div>
              <div className="tnum mt-0.5 font-display text-2xl text-paper-warm">{b.count}</div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-gunmetal">
                <div className="h-full rounded-full bg-cal-content" style={{ width: `${Math.round((b.count / maxFunnel) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Series */}
      {series.length > 0 && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {series.map((s) => (
            <Panel key={s.id} title={s.name} accent="media">
              <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-paper-muted">
                <StatusBadge status={s.status} />
                {s.primaryPlatform && <span>{s.primaryPlatform}</span>}
                <span>{s.episodeCount} episode{s.episodeCount === 1 ? "" : "s"} · {s.publishedCount} published</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <MetricCard label="Cost" value={formatCents(s.productionCostCents)} />
                <MetricCard label="Revenue" value={formatCents(s.revenueCents)} />
                <MetricCard label="Net" value={formatCents(s.netCents)} tone={s.netCents >= 0 ? "healthy" : "risk"} />
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* Episodes */}
      <Panel className="mt-6" title="Episodes">
        {episodes.length === 0 ? (
          <EmptyState title="No episodes yet" description="Create a content series and add episodes to track the production pipeline and attributed revenue." />
        ) : (
          <div className="scroll-steel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th><th>Title</th><th>Series</th><th>Stage</th>
                  <th>Film</th><th>Publish</th><th className="num">Posts</th>
                  <th className="num">Cost</th><th className="num">Revenue</th><th className="num">Net</th><th className="num">ROI</th>
                </tr>
              </thead>
              <tbody>
                {episodes.map((e) => (
                  <tr key={e.id}>
                    <td className="tnum text-paper-muted">{e.number ?? "—"}</td>
                    <td className="text-paper-warm">{e.title}</td>
                    <td className="text-paper-muted">{e.seriesName ?? "—"}</td>
                    <td><StatusBadge status={e.stage} /></td>
                    <td className="text-paper-muted">{fmtDate(e.filmDate)}</td>
                    <td className="text-paper-muted">{fmtDate(e.publishedDate ?? e.plannedPublishDate)}</td>
                    <td className="num">{e.postCount || "—"}</td>
                    <td className="num">{formatCents(e.productionCostCents ?? 0)}</td>
                    <td className="num text-status-gain">{formatCents(e.revenueCents)}</td>
                    <td className={`num font-medium ${e.netCents >= 0 ? "text-status-gain" : "text-status-loss"}`}>{formatCents(e.netCents)}</td>
                    <td className={`num ${e.roiPct >= 0 ? "text-paper-warm" : "text-status-loss"}`}>{e.productionCostCents ? `${e.roiPct}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="mt-4 text-xs text-paper-muted">
        Revenue is attributed per episode across ad, sponsor, affiliate, and merch sources. Camera and
        editing are tracked as workforce resources (Phase 5). Episodes and their posts appear on the
        Master Calendar on their publish dates.
      </p>
    </div>
  );
}
