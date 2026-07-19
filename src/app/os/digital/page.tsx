import { requireAuthWithPermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { PageHeader, Panel, MetricCard, StatusBadge, EmptyState, ProgressBar } from "@/components/ui/primitives";
import {
  listDigitalProducts, getDigitalSummary, listBlueprintSections, listDigitalProductsForSelect,
} from "@/server/services/commerce";
import { AddDigitalProductButton, AddSectionButton } from "./DigitalForms";

function fmtDate(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "—";
}

export default async function DigitalPage() {
  const ctx = await requireAuthWithPermission("commerce:read");
  const canWrite = can(ctx, "commerce:write");

  const [summary, products, blueprint] = await Promise.all([
    getDigitalSummary(ctx), listDigitalProducts(ctx), listBlueprintSections(ctx),
  ]);
  const [vehicleRows, productOpts] = canWrite
    ? await Promise.all([
        prisma.vehicle.findMany({ select: { id: true, year: true, make: true, model: true }, orderBy: { year: "asc" } }),
        listDigitalProductsForSelect(ctx),
      ])
    : [[], []];
  const vehicles = vehicleRows.map((v) => ({ id: v.id, label: `${v.year} ${v.make} ${v.model}` }));

  return (
    <div>
      <PageHeader
        eyebrow="Growth"
        title="Blueprint, Guide & Build Kit"
        subtitle="Digital products captured during the build — free build sheet, Blueprint, Complete Build Guide, and Build Kits."
        actions={canWrite ? (
          <div className="flex gap-2">
            <AddSectionButton vehicles={vehicles} products={productOpts} />
            <AddDigitalProductButton vehicles={vehicles} />
          </div>
        ) : undefined}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Digital Products" value={summary.productCount} accent="media" hint={`${summary.publishedCount} published`} />
        <MetricCard label="Units Sold" value={summary.totalSales} />
        <MetricCard label="Digital Revenue" value={formatCents(summary.revenueCents)} accent="financial" />
        <MetricCard label="Blueprint Coverage" value={`${blueprint.completenessPct}%`} tone={blueprint.completenessPct >= 66 ? "healthy" : "attention"} hint={`of ${blueprint.totalPhases} phases`} />
      </div>

      {/* Products */}
      <Panel className="mt-6" title="Digital Products">
        {products.length === 0 ? (
          <EmptyState title="No digital products yet" description="Create a Build Blueprint, Complete Build Guide, or Build Kit — assembled from sections captured during the build." />
        ) : (
          <div className="scroll-steel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th><th>Type</th><th>Status</th>
                  <th className="num">Price</th><th className="num">Sold</th><th className="num">Revenue</th><th className="num">Sections</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="text-paper-warm">{p.name}</td>
                    <td className="text-paper-steel">{p.type}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="num">{p.priceCents ? formatCents(p.priceCents) : <span className="text-status-gain">Free</span>}</td>
                    <td className="num">{p.salesCount || "—"}</td>
                    <td className="num text-status-gain">{formatCents(p.revenueCents)}</td>
                    <td className="num text-paper-muted">{p.sectionCount || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Blueprint sections */}
      <Panel className="mt-6" title="Blueprint Sections · captured during the build" accent="vehicle">
        <div className="mb-4 max-w-md">
          <div className="mb-1 flex justify-between text-xs text-paper-muted">
            <span>Build-phase coverage</span><span className="tnum">{blueprint.completenessPct}%</span>
          </div>
          <ProgressBar value={blueprint.completenessPct} />
        </div>
        {blueprint.sections.length === 0 ? (
          <p className="text-sm text-paper-muted">No sections captured yet. Capture them as each build phase completes — not reconstructed later.</p>
        ) : (
          <div className="scroll-steel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th className="num">#</th><th>Section</th><th>Phase</th><th>Product</th><th>Captured</th></tr>
              </thead>
              <tbody>
                {blueprint.sections.map((s) => (
                  <tr key={s.id}>
                    <td className="tnum text-paper-muted">{s.sequence || "—"}</td>
                    <td className="text-paper-warm">{s.title}</td>
                    <td className="text-paper-steel">{s.phaseName ?? "—"}</td>
                    <td className="text-paper-muted">{s.productName ?? "—"}</td>
                    <td className="text-paper-muted">{fmtDate(s.capturedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="mt-4 text-xs text-paper-muted">
        The free Build Sheet feeds the Blueprint, which feeds the premium Complete Build Guide; Build Kits
        turn the parts list into affiliate or proprietary revenue. Coverage tracks how much of the build
        has been documented as it happens.
      </p>
    </div>
  );
}
