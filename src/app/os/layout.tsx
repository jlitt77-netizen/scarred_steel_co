import { requireInternal } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { CEO_OS_NAV } from "@/lib/navigation";
import { Sidebar } from "@/components/Sidebar";

export default async function OsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireInternal();

  // Only show command centers the user is permitted to see. Sections with no
  // visible items are dropped.
  const sections = CEO_OS_NAV.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => item.permission === null || can(ctx, item.permission),
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <div className="flex">
      <Sidebar
        product={{ title: "CEO OS", accent: "rust", home: "/os" }}
        sections={sections}
        userName={ctx.name}
        roleLabel={ctx.roleKeys.join(", ") || "internal"}
      />
      <main className="h-screen flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
