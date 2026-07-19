import { requireAuthWithPermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { ResetPasswordButton } from "./UserActions";

type UserRow = Awaited<ReturnType<typeof loadUsers>>[number];
type RoleRow = Awaited<ReturnType<typeof loadRoles>>[number];

function loadUsers() {
  return prisma.user.findMany({
    include: { roles: { include: { role: true } } },
    orderBy: { createdAt: "asc" },
  });
}
function loadRoles() {
  return prisma.role.findMany({
    include: { _count: { select: { permissions: true, users: true } } },
    orderBy: { key: "asc" },
  });
}

export default async function UsersPage() {
  const ctx = await requireAuthWithPermission("user:read");
  const canWrite = can(ctx, "user:write");
  const [users, roles] = await Promise.all([loadUsers(), loadRoles()]);

  const userCols: Column<UserRow>[] = [
    { key: "name", header: "Name", render: (u) => <span className="text-paper-warm">{u.name}</span> },
    { key: "email", header: "Email", render: (u) => <span className="text-paper-steel">{u.email}</span> },
    { key: "scope", header: "Scope", render: (u) => <span className="badge">{u.isInternal ? "Internal" : "External"}</span> },
    { key: "roles", header: "Roles", render: (u) => <span className="text-paper-muted">{u.roles.map((r) => r.role.name).join(", ") || "—"}</span> },
    { key: "actions", header: "Password", align: "right", render: (u) => <ResetPasswordButton userId={u.id} canWrite={canWrite} /> },
  ];

  const roleCols: Column<RoleRow>[] = [
    { key: "role", header: "Role", render: (r) => (
      <div><div className="text-paper-warm">{r.name}</div><div className="text-xs text-paper-muted">{r.description}</div></div>
    ) },
    { key: "scope", header: "Scope", render: (r) => <span className="badge">{r.isInternal ? "Internal" : "External"}</span> },
    { key: "perms", header: "Permissions", align: "right", render: (r) => r._count.permissions },
    { key: "users", header: "Users", align: "right", render: (r) => r._count.users },
  ];

  return (
    <div className="space-y-8">
      <div>
        <PageHeader eyebrow="System" title="Users & Roles" subtitle={`${users.length} users · ${roles.length} roles`} />
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-paper-muted">Users</h2>
        <DataTable columns={userCols} rows={users} getKey={(u) => u.id} />
      </div>
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-paper-muted">Roles</h2>
        <DataTable columns={roleCols} rows={roles} getKey={(r) => r.id} />
      </div>
    </div>
  );
}
