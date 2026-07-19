import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// External Portal experience — scaffolded in Phase 1, delivered in Phase 11.
export default async function Page() {
  await requireAuthWithPermission("portal:fan");
  return (
    <ModulePlaceholder
      title="Fan / Community"
      phase={11}
      eyebrow="Planned Experience"
      summary="Follow builds, get episode alerts and progress photos, and see merch drops, blueprint releases, sale notices, Finds and Rescues."
      capabilities={[
        "Follow a build and get episode alerts",
        "Progress photos and merch drops",
        "Blueprint releases and vehicle sale notices",
        "Scarred Steel Co. Finds and Rescues"
      ]}
    />
  );
}
