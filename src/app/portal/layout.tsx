import { requireAuth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PORTAL_NAV } from "@/lib/navigation";
import { PortalShell } from "@/components/PortalShell";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAuth();

  const sections = PORTAL_NAV.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => item.permission === null || can(ctx, item.permission),
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <PortalShell sections={sections} userName={ctx.name}>
      {children}
    </PortalShell>
  );
}
