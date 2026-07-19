import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// Built, Not Broken / Build Lab (Section 28) — scaffolded in Phase 1.
export default async function Page() {
  await requireAuthWithPermission("project:read");
  return (
    <ModulePlaceholder
      eyebrow="Program"
      title="Build Lab · Built, Not Broken"
      phase={11}
      summary="Long-term experience and mission division: workshops, events, youth programs, mission-driven builds, sponsor activations."
      capabilities={[
        "Workshops and events",
        "Youth programs and mission-driven builds",
        "Sponsor activations and experiences",
        "Community and brand-story linkage",
      ]}
    />
  );
}
