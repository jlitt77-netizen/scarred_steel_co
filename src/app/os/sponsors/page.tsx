import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// Placeholder command center — scaffolded in Phase 1, delivered in Phase 7.
export default async function Page() {
  await requireAuthWithPermission("sponsor:read");
  return (
    <ModulePlaceholder
      title="Sponsorship & Partnership CRM"
      phase={7}
      summary="Sponsor pipeline, proposals, contracts, deliverables, approvals, and renewals — feeding internal scheduling."
      capabilities={[
        "Prospect → contacted → proposal → negotiating → active → renewal",
        "Cash, product, discount, affiliate commission tracking",
        "Deliverables, due dates, exclusivity, approvals",
        "Partner levels from product to founding partner"
      ]}
    />
  );
}
