import { requireAuthWithPermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { PageHeader, Panel, MetricCard, StatusBadge, EmptyState } from "@/components/ui/primitives";
import {
  listMerchProducts, getMerchSummary, listAffiliateProducts, getAffiliateSummary,
} from "@/server/services/commerce";
import { AddMerchButton, AddAffiliateButton } from "./CommerceForms";

function fmtDate(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "—";
}

export default async function CommercePage() {
  const ctx = await requireAuthWithPermission("commerce:read");
  const canWrite = can(ctx, "commerce:write");

  const [merchSum, merch, affSum, affiliates] = await Promise.all([
    getMerchSummary(ctx), listMerchProducts(ctx), getAffiliateSummary(ctx), listAffiliateProducts(ctx),
  ]);
  const vehicleRows = canWrite
    ? await prisma.vehicle.findMany({ select: { id: true, year: true, make: true, model: true }, orderBy: { year: "asc" } })
    : [];
  const vehicles = vehicleRows.map((v) => ({ id: v.id, label: `${v.year} ${v.make} ${v.model}` }));

  return (
    <div>
      <PageHeader
        eyebrow="Growth"
        title="Merchandise & Commerce"
        subtitle="Merch products, inventory, drops, and affiliate commerce — tied to builds and episodes."
        actions={canWrite ? (
          <div className="flex gap-2"><AddAffiliateButton vehicles={vehicles} /><AddMerchButton vehicles={vehicles} /></div>
        ) : undefined}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Merch Products" value={merchSum.productCount} accent="sponsor" hint={`${merchSum.dropCount} drops`} />
        <MetricCard label="Inventory Value (cost)" value={formatCents(merchSum.inventoryCostCents)} accent="financial" hint={`${merchSum.inventoryUnits} units`} />
        <MetricCard label="Low Stock" value={merchSum.lowStockCount} tone={merchSum.lowStockCount > 0 ? "attention" : "healthy"} />
        <MetricCard label="Affiliate Revenue" value={formatCents(affSum.revenueCents)} accent="media" hint={`${affSum.conversionRatePct}% conv.`} />
      </div>

      {/* Merch table */}
      <Panel className="mt-6" title="Merch">
        {merch.length === 0 ? (
          <EmptyState title="No merch yet" description="Add products to track margin, inventory, reorder points, and drops." />
        ) : (
          <div className="scroll-steel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th><th>Category</th><th>Status</th>
                  <th className="num">COGS</th><th className="num">Retail</th><th className="num">Margin</th>
                  <th className="num">Qty</th><th>Drop</th>
                </tr>
              </thead>
              <tbody>
                {merch.map((p) => (
                  <tr key={p.id}>
                    <td className="text-paper-warm">{p.name}{p.sku && <span className="ml-2 text-xs text-paper-muted">{p.sku}</span>}</td>
                    <td className="text-paper-muted">{p.category}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="num">{formatCents(p.cogsCents ?? 0)}</td>
                    <td className="num">{formatCents(p.retailCents ?? 0)}</td>
                    <td className="num text-status-gain">{formatCents(p.marginCents)}<span className="ml-1 text-xs text-paper-muted">{p.marginPct}%</span></td>
                    <td className={`num ${p.lowStock ? "text-status-attention" : "text-paper-warm"}`}>{p.inventoryQty}{p.lowStock ? " ⚠" : ""}</td>
                    <td className="text-paper-muted">{p.isDrop ? fmtDate(p.dropDate) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Affiliate table */}
      <Panel className="mt-6" title={`Affiliate Products · ${affSum.clicks} clicks · ${affSum.conversions} conversions`}>
        {affiliates.length === 0 ? (
          <p className="text-sm text-paper-muted">No affiliate products yet.</p>
        ) : (
          <div className="scroll-steel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th><th>Vendor</th>
                  <th className="num">Clicks</th><th className="num">Conv.</th><th className="num">Rate</th>
                  <th className="num">Comm.</th><th className="num">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((a) => (
                  <tr key={a.id}>
                    <td className="text-paper-warm">{a.url ? <a href={a.url} target="_blank" rel="noreferrer" className="hover:text-rust-400">{a.name}</a> : a.name}</td>
                    <td className="text-paper-muted">{a.vendor ?? "—"}</td>
                    <td className="num">{a.clicks}</td>
                    <td className="num">{a.conversions}</td>
                    <td className="num text-paper-muted">{a.conversionRatePct}%</td>
                    <td className="num text-paper-muted">{a.commissionPct != null ? `${a.commissionPct}%` : "—"}</td>
                    <td className="num text-status-gain">{formatCents(a.revenueCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="mt-4 text-xs text-paper-muted">
        Margin is retail − COGS. Low-stock flags products at or below their reorder point. Affiliate
        revenue and conversions attribute back to builds and episodes; realized sales roll into the
        Financial Command Center.
      </p>
    </div>
  );
}
