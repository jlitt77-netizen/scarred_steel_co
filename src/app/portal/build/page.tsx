import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// External Portal experience — scaffolded in Phase 1, delivered in Phase 11.
export default async function Page() {
  await requireAuthWithPermission("portal:customer");
  return (
    <ModulePlaceholder
      title="My Build"
      phase={11}
      eyebrow="Planned Experience"
      summary="Follow your build: progress, approved scope, customer timeline, contract amount, approved change orders, payments, balance due, and photos."
      capabilities={[
        "Vehicle, project, and progress updates with photos",
        "Approved scope and customer-facing timeline",
        "Contract amount, approved change orders, payments, balance due",
        "Approve / decline / ask a question — approvals feed the internal schedule & forecast"
      ]}
    />
  );
}
