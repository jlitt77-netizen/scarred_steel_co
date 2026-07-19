import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// Placeholder command center — scaffolded in Phase 1, delivered in Phase 10.
export default async function Page() {
  await requireAuthWithPermission("risk:read");
  return (
    <ModulePlaceholder
      title="Risk, Decisions & Exceptions"
      phase={10}
      summary="Confidential risk register with response options that preview schedule, cost, revenue, and cash impact before approval."
      capabilities={[
        "14 risk categories (parts delay, cash shortage, giveaway legal hold, …)",
        "Response options (expedite, change vendor, add labor, protect sale date, …)",
        "Impact preview on schedule / cost / revenue / cash before approval",
        "Exception queue"
      ]}
    />
  );
}
