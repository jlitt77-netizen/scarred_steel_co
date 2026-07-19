import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// Placeholder command center — scaffolded in Phase 1, delivered in Phase 9.
export default async function Page() {
  await requireAuthWithPermission("vehicle:read");
  return (
    <ModulePlaceholder
      title="Fleet & Long-Term Assets"
      phase={9}
      summary="Keep-vs-sell modeling across cost and brand/media value, producing KEEP / REVIEW ANNUALLY / SELL CANDIDATE."
      capabilities={[
        "Classify inventory, content, shop, show, event, giveaway assets",
        "Cost side: cash, market value, insurance, storage, opportunity cost",
        "Value side: media, sponsor, affiliate, merch, event, brand",
        "KEEP / REVIEW / SELL recommendation"
      ]}
    />
  );
}
