import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// Scarred Steel Co. Rescues (Section 27) — scaffolded in Phase 1.
export default async function Page() {
  await requireAuthWithPermission("vehicle:read");
  return (
    <ModulePlaceholder
      eyebrow="Program"
      title="Scarred Steel Rescues"
      phase={9}
      summary="Find → Rescue → Revive → Decide. Acts as both a content engine and an acquisition engine."
      capabilities={[
        "Rescue pipeline from find to decision",
        "Outcomes: build, sell, giveaway, keep, pass along",
        "Content series linkage",
        "Acquisition linkage to Vehicle Portfolio",
      ]}
    />
  );
}
