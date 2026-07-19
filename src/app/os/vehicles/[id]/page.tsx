import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthWithPermission } from "@/lib/auth";
import { getVehicle } from "@/server/services/vehicles";
import { can } from "@/lib/rbac";
import { formatCents } from "@/lib/money";
import { Panel, StatusBadge } from "@/components/ui/primitives";
import { IconTruck } from "@/components/ui/icons";

// Tabs from Section 15. Only Overview is interactive in Phase 1; the rest are
// present as the permanent structure and marked as their delivering phase.
const TABS = [
  "Overview", "Build Plan", "Schedule", "Parts", "Costs", "Media",
  "Sponsors", "Blueprint", "Documents", "Photos", "History",
];

export default async function VehicleDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireAuthWithPermission("vehicle:read");
  const vehicle = await getVehicle(ctx, id);
  if (!vehicle) notFound();

  const showFinance = can(ctx, "finance:read");
  const m = vehicle.metrics;

  const econ: { label: string; value: string; confidential?: boolean }[] = [
    { label: "Acquisition Cost", value: formatCents(vehicle.acquisitionCostCents) },
    { label: "Build Budget", value: formatCents(vehicle.buildBudgetCents) },
    { label: "Revised Budget", value: formatCents(vehicle.revisedBudgetCents) },
    { label: "Actual Cost", value: formatCents(vehicle.actualCostCents) },
    { label: "Sponsor Cash", value: formatCents(vehicle.sponsorCashCents) },
    { label: "Sponsor Product Offsets", value: formatCents(vehicle.sponsorProductOffsetsCents) },
    { label: "True Cash Invested", value: formatCents(m.trueCashInvestedCents), confidential: true },
    { label: "Current Market Value", value: formatCents(vehicle.currentMarketValueCents) },
    { label: "Target Sale Price", value: formatCents(vehicle.targetSalePriceCents) },
    { label: "Vehicle Profit", value: m.vehicleProfitCents == null ? "— (unsold)" : formatCents(m.vehicleProfitCents), confidential: true },
    { label: "ROI", value: m.roi == null ? "—" : `${(m.roi * 100).toFixed(1)}%`, confidential: true },
    { label: "Holding Period", value: m.holdingPeriodMonths == null ? "—" : `${m.holdingPeriodMonths} mo` },
  ];

  return (
    <div>
      <Link href="/os/vehicles" className="text-sm text-paper-muted hover:text-rust-400">
        ← Vehicles &amp; Builds
      </Link>

      {/* Vehicle header with large image slot */}
      <div className="surface-texture mt-2 flex flex-col gap-4 rounded-md border border-bg-gunmetal p-5 sm:flex-row sm:items-center">
        <div className="flex h-28 w-full items-center justify-center rounded border border-bg-gunmetal bg-bg-nearblack sm:w-48">
          <IconTruck className="text-5xl text-bg-panel" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl uppercase leading-none text-paper-warm sm:text-4xl">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <StatusBadge status={vehicle.status} />
          </div>
          {vehicle.nickname && <div className="mt-1 text-sm text-paper-muted">&ldquo;{vehicle.nickname}&rdquo;</div>}
          <div className="mt-3 flex flex-wrap gap-6 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-paper-muted">Invested</div>
              <div className="tnum text-paper-warm">{formatCents(m.trueCashInvestedCents)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-paper-muted">Market Value</div>
              <div className="tnum text-paper-warm">{formatCents(vehicle.currentMarketValueCents)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-paper-muted">Target Sale</div>
              <div className="tnum text-paper-warm">{formatCents(vehicle.targetSalePriceCents)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="scroll-steel mt-4 flex gap-1 overflow-x-auto border-b border-bg-gunmetal">
        {TABS.map((t, i) => (
          <button
            key={t}
            disabled={i !== 0}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm ${
              i === 0
                ? "border-rust text-paper-warm"
                : "border-transparent text-paper-muted/60"
            }`}
            title={i !== 0 ? "Coming in a later phase" : undefined}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview tab content */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Panel accent="financial" title={`Economics${!showFinance ? " (finance access required for some figures)" : ""}`}>
          <dl className="space-y-1.5">
            {econ.map((r) => {
              const hide = r.confidential && !showFinance;
              return (
                <div key={r.label} className="flex justify-between text-sm">
                  <dt className="text-paper-muted">{r.label}</dt>
                  <dd className={`tnum ${hide ? "text-paper-muted/50" : "text-paper-warm"}`}>
                    {hide ? "restricted" : r.value}
                  </dd>
                </div>
              );
            })}
          </dl>
        </Panel>

        <Panel accent="vehicle" title="Build Projects">
          {vehicle.projects.length === 0 ? (
            <p className="text-sm text-paper-muted">No projects linked yet.</p>
          ) : (
            <ul className="space-y-2">
              {vehicle.projects.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-paper-steel">{p.name}</span>
                  <StatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
