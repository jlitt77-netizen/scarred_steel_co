import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// External Portal experience — scaffolded in Phase 1, delivered in Phase 11.
export default async function Page() {
  await requireAuthWithPermission("portal:sponsor");
  return (
    <ModulePlaceholder
      title="Sponsor Portal"
      phase={11}
      summary="Your partnership, deliverables, scheduled and published content, links, views, clicks, performance, approvals, and renewal dates."
      capabilities={[
        "Partnership, deliverables, and renewal dates",
        "Scheduled and published content with links and performance",
        "Approve content or request changes — approvals update internal scheduling",
        "No confidential sponsor values or internal margins are shown"
      ]}
    />
  );
}
