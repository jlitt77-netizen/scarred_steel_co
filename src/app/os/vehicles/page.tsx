import Link from "next/link";
import { requireAuthWithPermission } from "@/lib/auth";
import { listVehicles } from "@/server/services/vehicles";
import { can } from "@/lib/rbac";
import { formatCents, sumCents } from "@/lib/money";
import { PageHeader, MetricCard, StatusBadge } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { VehicleCard } from "@/components/ui/VehicleCard";
import { NewVehicleForm } from "./NewVehicleForm";

type Row = Awaited<ReturnType<typeof listVehicles>>[number];

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const gallery = view === "gallery";
  const ctx = await requireAuthWithPermission("vehicle:read");
  const vehicles = await listVehicles(ctx);
  const canWrite = can(ctx, "vehicle:write");

  const activeBuilds = vehicles.filter((v) => v.status === "Active Build").length;
  const invested = sumCents(vehicles.map((v) => v.metrics.trueCashInvestedCents));
  const marketValue = sumCents(vehicles.map((v) => v.currentMarketValueCents));

  const columns: Column<Row>[] = [
    {
      key: "vehicle",
      header: "Vehicle",
      render: (v) => (
        <span>
          {v.year} {v.make} {v.model}
          {v.nickname ? <span className="text-paper-muted"> · &ldquo;{v.nickname}&rdquo;</span> : ""}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (v) => <StatusBadge status={v.status} /> },
    { key: "acq", header: "Acquisition", align: "right", render: (v) => formatCents(v.acquisitionCostCents, { blankIfNull: true }) || "—" },
    { key: "budget", header: "Build Budget", align: "right", render: (v) => formatCents(v.buildBudgetCents, { blankIfNull: true }) || "—" },
    { key: "invested", header: "True Cash Invested", align: "right", render: (v) => <span className="text-paper-warm">{formatCents(v.metrics.trueCashInvestedCents)}</span> },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Vehicles & Builds"
        subtitle={`${vehicles.length} vehicles in the portfolio`}
        actions={
          <div className="flex items-center gap-2">
            <div className="hidden overflow-hidden rounded border border-bg-gunmetal sm:flex">
              <Link href="/os/vehicles" className={`px-3 py-1.5 text-xs ${!gallery ? "bg-bg-gunmetal text-paper-warm" : "text-paper-muted"}`}>Table</Link>
              <Link href="/os/vehicles?view=gallery" className={`px-3 py-1.5 text-xs ${gallery ? "bg-bg-gunmetal text-paper-warm" : "text-paper-muted"}`}>Gallery</Link>
            </div>
            {canWrite && <NewVehicleForm />}
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Vehicles" value={vehicles.length} accent="vehicle" />
        <MetricCard label="Active Builds" value={activeBuilds} />
        <MetricCard label="Total Invested" value={formatCents(invested)} accent="financial" />
        <MetricCard label="Portfolio Market Value" value={formatCents(marketValue)} />
      </div>

      {gallery ? (
        vehicles.length === 0 ? (
          <p className="text-paper-muted">No vehicles yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {vehicles.map((v) => (
              <VehicleCard
                key={v.id}
                v={{
                  id: v.id, year: v.year, make: v.make, model: v.model, nickname: v.nickname,
                  status: v.status, trueCashInvestedCents: v.metrics.trueCashInvestedCents,
                  currentMarketValueCents: v.currentMarketValueCents,
                }}
              />
            ))}
          </div>
        )
      ) : (
        <DataTable columns={columns} rows={vehicles} getKey={(v) => v.id} rowHref={(v) => `/os/vehicles/${v.id}`} empty="No vehicles yet." />
      )}
    </div>
  );
}
