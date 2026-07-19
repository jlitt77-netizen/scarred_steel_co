import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// Placeholder command center — scaffolded in Phase 1, delivered in Phase 8.
export default async function Page() {
  await requireAuthWithPermission("commerce:read");
  return (
    <ModulePlaceholder
      title="Merchandise & Commerce"
      phase={8}
      summary="Merch products, SKUs, inventory, drops, and affiliate commerce linked to builds and episodes."
      capabilities={[
        "COGS, retail, margin, inventory, reorder points",
        "Build-specific and limited drops",
        "Affiliate products, URLs, clicks, conversions, revenue",
        "Links to build, episode, and sponsor"
      ]}
    />
  );
}
