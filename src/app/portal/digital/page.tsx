import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// External Portal experience — scaffolded in Phase 1, delivered in Phase 11.
export default async function Page() {
  await requireAuthWithPermission("portal:digital");
  return (
    <ModulePlaceholder
      title="Digital Products"
      phase={11}
      eyebrow="Planned Experience"
      summary="My Garage of purchased blueprints and guides, the Build Planner, saved builds, Build Kits, and affiliate shopping."
      capabilities={[
        "My Garage: purchased blueprints and guides",
        "Interactive Build Planner and saved builds",
        "Build Kits",
        "Affiliate shopping"
      ]}
    />
  );
}
