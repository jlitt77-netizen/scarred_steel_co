import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// Placeholder command center — scaffolded in Phase 1, delivered in Phase 4.
export default async function Page() {
  await requireAuthWithPermission("finance:read");
  return (
    <ModulePlaceholder
      title="Financial Command Center"
      phase={4}
      summary="The central financial engine: cash, A/R, A/P, commitments, budget-vs-actual, and P&L by segment. Confidential — internal only."
      capabilities={[
        "Bank cash, protected reserve, restricted & giveaway reserves",
        "Accounts receivable and accounts payable by category",
        "Daily/weekly/monthly/quarterly/annual views",
        "P&L by segment (automotive, media, sponsorship, affiliate, merch, digital, …)",
        "12-month rolling forecast fed by schedule changes"
      ]}
    />
  );
}
