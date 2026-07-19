import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// External Portal experience — scaffolded in Phase 1, delivered in Phase 11.
export default async function Page() {
  await requireAuthWithPermission("portal:giveaway");
  return (
    <ModulePlaceholder
      title="Giveaways"
      phase={11}
      eyebrow="Planned Experience"
      summary="Public giveaway experience: prize, dates, official rules, eligibility, and entry instructions. Internal compliance stays private."
      capabilities={[
        "Prize and key dates",
        "Official rules and eligibility",
        "Entry instructions",
        "Internal compliance workflow remains private"
      ]}
    />
  );
}
