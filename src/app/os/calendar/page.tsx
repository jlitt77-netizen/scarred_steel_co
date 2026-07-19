import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// Placeholder command center — scaffolded in Phase 1, delivered in Phase 2.
export default async function Page() {
  await requireAuthWithPermission("calendar:read");
  return (
    <ModulePlaceholder
      title="Master Operating Calendar"
      phase={2}
      summary="The central scheduling engine: day/week/month/quarter/year/rolling-12 views over the four-date event model, with the dependency & rescheduling engine."
      capabilities={[
        "Operational, financial, content, and revenue timing on one calendar",
        "Filters across vehicle, project, resource, sponsor, cash, revenue",
        "Dependency detection and downstream impact preview",
        "Cascade approval → reforecast → audit → notify"
      ]}
      showCalendarLegend
    />
  );
}
