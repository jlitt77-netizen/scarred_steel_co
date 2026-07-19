import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// Placeholder command center — scaffolded in Phase 1, delivered in Phase 5.
export default async function Page() {
  await requireAuthWithPermission("project:read");
  return (
    <ModulePlaceholder
      title="Partner-Shop Production"
      phase={5}
      summary="Work orders, capacity, and spend for partner shops; answers overload, monthly pay, and dedicated-bay/JV/standalone questions."
      capabilities={[
        "Work orders, hourly / fixed / retainer, estimated vs actual hours",
        "Capacity and schedule-conflict detection",
        "Monthly partner-shop payables",
        "Dedicated bay vs JV vs standalone modeling"
      ]}
    />
  );
}
