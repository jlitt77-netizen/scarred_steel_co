import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// Placeholder command center — scaffolded in Phase 1, delivered in Phase 6.
export default async function Page() {
  await requireAuthWithPermission("media:read");
  return (
    <ModulePlaceholder
      title="Media & Content"
      phase={6}
      summary="Every major vehicle as a content series: episodes, filming, editing, costs, and attributed revenue."
      capabilities={[
        "Episode concept → script → film → edit → publish",
        "Camera and editing scheduling as tracked resources",
        "Production cost per session / per episode",
        "Attributed ad / sponsor / affiliate / merch revenue"
      ]}
    />
  );
}
