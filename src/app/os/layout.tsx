import { requireInternal } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { CEO_OS_NAV } from "@/lib/navigation";
import { AppShell } from "@/components/AppShell";
import { ROLES } from "@/lib/rbac-catalog";

const ROLE_NAME = new Map(ROLES.map((r) => [r.key, r.name]));

export default async function OsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireInternal();

  // Only show command centers the user is permitted to see. Empty sections drop.
  const sections = CEO_OS_NAV.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => item.permission === null || can(ctx, item.permission),
    ),
  })).filter((section) => section.items.length > 0);

  const riskCount = can(ctx, "risk:read")
    ? await prisma.risk.count({ where: { status: { in: ["open", "mitigating"] } } })
    : null;

  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const roleLabel =
    ctx.roleKeys.map((k) => ROLE_NAME.get(k) ?? k).join(", ") || "Internal";

  return (
    <AppShell
      product={{ title: "CEO OS", home: "/os" }}
      sections={sections}
      userName={ctx.name}
      roleLabel={roleLabel}
      today={today}
      riskCount={riskCount}
      canQuickAdd={can(ctx, "vehicle:write")}
    >
      {children}
    </AppShell>
  );
}
