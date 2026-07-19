import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// Placeholder command center — scaffolded in Phase 1, delivered in Phase 10.
export default async function Page() {
  await requireAuthWithPermission("ceo:dashboard");
  return (
    <ModulePlaceholder
      title="CEO Command Center"
      phase={10}
      summary="Cash, obligations, active builds, risks, and decisions requiring approval — plus the Monday Morning CEO Brief."
      capabilities={[
        "Cash in bank, protected reserve, available operating cash, committed cash",
        "7/30/60/90-day obligations and expected revenue",
        "Builds behind schedule / over budget",
        "Sponsor obligations, camera & editing backlog, social scheduled",
        "Customer approvals pending, giveaway compliance issues",
        "Monday Morning CEO Brief"
      ]}
    />
  );
}
