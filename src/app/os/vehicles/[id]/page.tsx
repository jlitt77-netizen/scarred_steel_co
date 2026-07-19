import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthWithPermission } from "@/lib/auth";
import { getVehicle } from "@/server/services/vehicles";
import { can } from "@/lib/rbac";
import { formatCents } from "@/lib/money";

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

  const rows: { label: string; value: string; confidential?: boolean }[] = [
    { label: "Acquisition Cost", value: formatCents(vehicle.acquisitionCostCents) },
    { label: "Build Budget", value: formatCents(vehicle.buildBudgetCents) },
    { label: "Revised Budget", value: formatCents(vehicle.revisedBudgetCents) },
    { label: "Actual Cost", value: formatCents(vehicle.actualCostCents) },
    { label: "Sponsor Cash", value: formatCents(vehicle.sponsorCashCents) },
    { label: "Sponsor Product Offsets", value: formatCents(vehicle.sponsorProductOffsetsCents) },
    { label: "True Cash Invested", value: formatCents(m.trueCashInvestedCents), confidential: true },
    { label: "Current Market Value", value: formatCents(vehicle.currentMarketValueCents) },
    { label: "Target Sale Price", value: formatCents(vehicle.targetSalePriceCents) },
    {
      label: "Vehicle Profit",
      value: m.vehicleProfitCents == null ? "— (unsold)" : formatCents(m.vehicleProfitCents),
      confidential: true,
    },
    { label: "ROI", value: m.roi == null ? "—" : `${(m.roi * 100).toFixed(1)}%`, confidential: true },
    {
      label: "Holding Period",
      value: m.holdingPeriodMonths == null ? "—" : `${m.holdingPeriodMonths} mo`,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/os/vehicles" className="text-sm text-steel-400 hover:text-rust-400">
        ← Vehicle Portfolio
      </Link>
      <div className="mb-6 mt-2 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-steel-100">
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.nickname ? ` · "${vehicle.nickname}"` : ""}
        </h1>
        <span className="badge">{vehicle.status}</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-steel-400">
            Economics{" "}
            {!showFinance && (
              <span className="ml-1 text-[10px] text-steel-600">
                (some figures require finance access)
              </span>
            )}
          </h2>
          <dl className="space-y-1.5">
            {rows.map((r) => {
              const hide = r.confidential && !showFinance;
              return (
                <div key={r.label} className="flex justify-between text-sm">
                  <dt className="text-steel-400">{r.label}</dt>
                  <dd className={hide ? "text-steel-600" : "text-steel-100"}>
                    {hide ? "restricted" : r.value}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>

        <div className="card">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-steel-400">
            Build Projects
          </h2>
          {vehicle.projects.length === 0 ? (
            <p className="text-sm text-steel-500">No projects linked yet.</p>
          ) : (
            <ul className="space-y-2">
              {vehicle.projects.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-steel-200">{p.name}</span>
                  <span className="badge">{p.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
