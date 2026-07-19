import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// Placeholder command center — scaffolded in Phase 1, delivered in Phase 5.
export default async function Page() {
  await requireAuthWithPermission("project:read");
  return (
    <ModulePlaceholder
      title="Team, Workforce & Compensation"
      phase={5}
      summary="People, rates, capacity, and compensation-model scenarios from partner-shop to standalone facility."
      capabilities={[
        "Contractor / partner-shop / employee models",
        "Rates, salary, benefits, payroll burden, bonus",
        "Capacity, assignments, workload",
        "Stay / dedicated bay / JV / hire core team / standalone scenarios"
      ]}
    />
  );
}
