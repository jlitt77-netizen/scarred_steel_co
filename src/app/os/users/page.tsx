import { requireAuthWithPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function UsersPage() {
  await requireAuthWithPermission("user:read");
  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      include: { roles: { include: { role: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.role.findMany({
      include: { _count: { select: { permissions: true, users: true } } },
      orderBy: { key: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-steel-100">Users &amp; Roles</h1>
        <p className="text-steel-400">{users.length} users · {roles.length} roles.</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-steel-400">Users</h2>
        <div className="overflow-hidden rounded-lg border border-steel-800">
          <table className="w-full text-sm">
            <thead className="bg-steel-900 text-left text-xs uppercase tracking-wide text-steel-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Roles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-800">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-steel-100">{u.name}</td>
                  <td className="px-4 py-3 text-steel-300">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="badge">{u.isInternal ? "Internal" : "External"}</span>
                  </td>
                  <td className="px-4 py-3 text-steel-400">
                    {u.roles.map((r) => r.role.name).join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-steel-400">Roles</h2>
        <div className="overflow-hidden rounded-lg border border-steel-800">
          <table className="w-full text-sm">
            <thead className="bg-steel-900 text-left text-xs uppercase tracking-wide text-steel-500">
              <tr>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3 text-right">Permissions</th>
                <th className="px-4 py-3 text-right">Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-800">
              {roles.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <div className="text-steel-100">{r.name}</div>
                    <div className="text-xs text-steel-500">{r.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge">{r.isInternal ? "Internal" : "External"}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-steel-300">{r._count.permissions}</td>
                  <td className="px-4 py-3 text-right text-steel-300">{r._count.users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
