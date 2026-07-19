import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// Placeholder command center — scaffolded in Phase 1, delivered in Phase 9.
export default async function Page() {
  await requireAuthWithPermission("giveaway:read");
  return (
    <ModulePlaceholder
      title="Giveaway Planning & Compliance"
      phase={9}
      summary="Compliance-gated giveaway workflow; LAUNCH BLOCKED until attorney review, rules, eligibility, tax, and funding gates pass."
      capabilities={[
        "Concept → prize → attorney review → rules → eligibility → funding",
        "Hard launch gates: LAUNCH BLOCKED until compliance complete",
        "Winner selection, verification, prize transfer, tax docs",
        "All giveaway dates flow through the Master Calendar"
      ]}
    />
  );
}
