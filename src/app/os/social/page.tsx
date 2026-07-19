import { requireAuthWithPermission } from "@/lib/auth";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// Placeholder command center — scaffolded in Phase 1, delivered in Phase 6.
export default async function Page() {
  await requireAuthWithPermission("media:read");
  return (
    <ModulePlaceholder
      title="Social Media"
      phase={6}
      summary="Multi-platform publishing pipeline; episodes auto-spawn teasers, shorts, reels, and sponsor/affiliate/merch posts."
      capabilities={[
        "YouTube, Shorts, Instagram, Reels, TikTok, Facebook, Email, SMS",
        "Idea → draft → creative ready → sponsor review → scheduled → published",
        "Auto-generated post sets from an episode",
        "All posts flow through the Master Calendar"
      ]}
    />
  );
}
