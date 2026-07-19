import Link from "next/link";
import { requireAuthWithPermission } from "@/lib/auth";
import { listVehicles } from "@/server/services/vehicles";
import { can } from "@/lib/rbac";
import { formatCents } from "@/lib/money";
import { NewVehicleForm } from "./NewVehicleForm";

export default async function VehiclesPage() {
  const ctx = await requireAuthWithPermission("vehicle:read");
  const vehicles = await listVehicles(ctx);
  const canWrite = can(ctx, "vehicle:write");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-steel-100">Vehicle Portfolio & Build</h1>
          <p className="text-steel-400">{vehicles.length} vehicles</p>
        </div>
        {canWrite && <NewVehicleForm />}
      </div>

      <div className="overflow-x-auto rounded-lg border border-steel-800">
        <table className="w-full text-sm">
          <thead className="bg-steel-900 text-left text-xs uppercase tracking-wide text-steel-500">
            <tr>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Acquisition</th>
              <th className="px-4 py-3 text-right">Build Budget</th>
              <th className="px-4 py-3 text-right">True Cash Invested</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-steel-800">
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-steel-900/50">
                <td className="px-4 py-3">
                  <Link href={`/os/vehicles/${v.id}`} className="font-medium text-steel-100 hover:text-rust-400">
                    {v.year} {v.make} {v.model}
                    {v.nickname ? ` · "${v.nickname}"` : ""}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="badge">{v.status}</span>
                </td>
                <td className="px-4 py-3 text-right text-steel-300">
                  {formatCents(v.acquisitionCostCents, { blankIfNull: true }) || "—"}
                </td>
                <td className="px-4 py-3 text-right text-steel-300">
                  {formatCents(v.buildBudgetCents, { blankIfNull: true }) || "—"}
                </td>
                <td className="px-4 py-3 text-right font-medium text-steel-100">
                  {formatCents(v.metrics.trueCashInvestedCents)}
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-steel-500">
                  No vehicles yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
