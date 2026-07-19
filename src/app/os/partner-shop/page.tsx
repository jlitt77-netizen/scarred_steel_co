import { requireAuthWithPermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { PageHeader, Panel, MetricCard, CapacityMeter, StatusBadge, EmptyState } from "@/components/ui/primitives";
import { listPartnerShops, listWorkOrders } from "@/server/services/workforce";
import { AddWorkOrderButton } from "./WorkOrderForm";

function fmtDate(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "—";
}

export default async function PartnerShopPage() {
  const ctx = await requireAuthWithPermission("project:read");
  const canWrite = can(ctx, "project:write");

  const [shops, workOrders, projects, shopOpts] = await Promise.all([
    listPartnerShops(ctx),
    listWorkOrders(ctx),
    prisma.project.findMany({ select: { id: true, name: true, vehicleId: true }, orderBy: { createdAt: "asc" } }),
    prisma.partnerShop.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const scheduledSpendCents = shops.reduce((s, sh) => s + sh.scheduledCents, 0);
  const overloaded = shops.filter((s) => s.util.overloaded).length;

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Partner-Shop Production"
        subtitle="Work orders, capacity, and spend across partner shops — who's overloaded, what's scheduled, and what we owe."
        actions={canWrite ? <AddWorkOrderButton shops={shopOpts} projects={projects} /> : undefined}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Active Shops" value={shops.length} accent="vehicle" />
        <MetricCard label="Work Orders" value={workOrders.length} />
        <MetricCard label="Scheduled Spend" value={formatCents(scheduledSpendCents)} accent="financial" />
        <MetricCard label="Overloaded Shops" value={overloaded} tone={overloaded > 0 ? "risk" : "healthy"} />
      </div>

      {/* Per-shop capacity + spend */}
      {shops.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No partner shops" description="Add a partner shop and work orders to track capacity and spend." />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {shops.map((s) => (
            <Panel key={s.id} title={s.name} accent={s.util.overloaded ? "risk" : "vehicle"}>
              <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-paper-muted">
                <span>{formatCents(s.hourlyRateCents)}/hr</span>
                <span>{s.capacityHoursPerWeek ?? 0} hrs/wk capacity</span>
                <span>{s.workOrderCount} work order{s.workOrderCount === 1 ? "" : "s"}</span>
                {s.util.overloaded && <span className="text-status-critical">Overloaded</span>}
              </div>
              <CapacityMeter
                label={`${s.util.committedHoursPerMonth} / ${s.util.capacityHoursPerMonth} committed hrs / mo`}
                percent={s.util.utilizationPct}
              />
              <div className="mt-4 grid grid-cols-3 gap-3">
                <MetricCard label="Estimated" value={formatCents(s.estimatedCents)} />
                <MetricCard label="Actual" value={formatCents(s.actualCents)} />
                <MetricCard label="Scheduled" value={formatCents(s.scheduledCents)} accent="financial" />
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* Work orders */}
      <Panel className="mt-6" title="Work Orders">
        {workOrders.length === 0 ? (
          <p className="text-sm text-paper-muted">No work orders yet.</p>
        ) : (
          <div className="scroll-steel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th><th>Shop</th><th>Type</th>
                  <th className="num">Est hrs</th><th className="num">Act hrs</th>
                  <th className="num">Estimated</th><th className="num">Actual</th>
                  <th>Scheduled</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((wo) => (
                  <tr key={wo.id}>
                    <td className="text-paper-warm">{wo.title}</td>
                    <td className="text-paper-muted">{wo.partnerShop?.name ?? "—"}</td>
                    <td className="text-paper-steel">{wo.type}</td>
                    <td className="num">{wo.estimatedHours ?? "—"}</td>
                    <td className="num">{wo.actualHours ?? "—"}</td>
                    <td className="num text-paper-warm">{formatCents(wo.estimatedCostCents)}</td>
                    <td className="num text-paper-warm">{formatCents(wo.actualCostCents)}</td>
                    <td className="text-paper-muted">{fmtDate(wo.scheduledStart)}{wo.scheduledEnd ? ` → ${fmtDate(wo.scheduledEnd)}` : ""}</td>
                    <td><StatusBadge status={wo.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="mt-4 text-xs text-paper-muted">
        Committed hours reflect remaining estimated work (estimated − actual) on scheduled and in-progress
        orders. Fixed-price orders count toward spend but not hourly capacity.
      </p>
    </div>
  );
}
