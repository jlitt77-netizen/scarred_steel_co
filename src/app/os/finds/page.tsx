import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// Scarred Steel Co. Finds (Section 26) — scaffolded in Phase 1.
export default async function Page() {
  await requireAuthWithPermission("vehicle:read");
  return (
    <ModulePlaceholder
      eyebrow="Program"
      title="Scarred Steel Finds"
      phase={9}
      summary="Public vehicle submissions feeding an internal acquisition pipeline: New → Reject → Save → Contact → Evaluate → Acquire."
      capabilities={[
        "Public submissions (photos, location, vehicle, seller, asking price)",
        "Internal review pipeline with acquire/reject decisions",
        "Value paths: acquisition, content, referral, brokerage, marketplace",
        "Feeds the Vehicle Portfolio when acquired",
      ]}
    />
  );
}
