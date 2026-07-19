import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// Placeholder command center — scaffolded in Phase 1, delivered in Phase 10.
export default async function Page() {
  await requireAuthWithPermission("forecast:read");
  return (
    <ModulePlaceholder
      title="Master Forecast & Scenario"
      phase={10}
      summary="What-if scenarios showing impact on cash, runway, profit, schedule, capacity, and revenue timing."
      capabilities={[
        "Buy vehicle / delay build / lose sponsor / hire team / open facility",
        "Keep vs sell vs giveaway a vehicle",
        "Revenue drop and budget-overrun stress tests",
        "12-month rolling reforecast"
      ]}
    />
  );
}
