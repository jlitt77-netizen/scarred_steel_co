import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// Placeholder command center — scaffolded in Phase 1, delivered in Phase 8.
export default async function Page() {
  await requireAuthWithPermission("commerce:read");
  return (
    <ModulePlaceholder
      title="Blueprint, Guide & Build Kit"
      phase={8}
      summary="Digital products captured during the build: free build sheet, Build Blueprint, Complete Build Guide, and Build Kits."
      capabilities={[
        "Blueprint sections captured during the build (not reconstructed later)",
        "Parts database with affiliate URLs and sponsors",
        "Complete Build Guide premium product",
        "Build Kits (affiliate / dealer margin → proprietary)"
      ]}
    />
  );
}
