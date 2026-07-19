import { requireAuth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PORTAL_NAV } from "@/lib/navigation";
import { Sidebar } from "@/components/Sidebar";

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
    <div className="flex">
      <Sidebar
        product={{ title: "Portal", accent: "steel", home: "/portal" }}
        sections={sections}
        userName={ctx.name}
        roleLabel={ctx.roleKeys.join(", ") || "member"}
      />
      <main className="h-screen flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
