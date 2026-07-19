import { requireAuthWithPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AuditPage() {
  await requireAuthWithPermission("audit:read");
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-1 text-2xl font-bold text-steel-100">Audit &amp; History</h1>
      <p className="mb-6 text-steel-400">
        Most recent 100 material changes. Nothing important moves silently.
      </p>

      <div className="overflow-x-auto rounded-lg border border-steel-800">
        <table className="w-full text-sm">
          <thead className="bg-steel-900 text-left text-xs uppercase tracking-wide text-steel-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Field</th>
              <th className="px-4 py-3">User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-steel-800">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 text-steel-400">{l.createdAt.toISOString().replace("T", " ").slice(0, 19)}</td>
                <td className="px-4 py-3 text-steel-200">{l.entityType}</td>
                <td className="px-4 py-3"><span className="badge">{l.action}</span></td>
                <td className="px-4 py-3 text-steel-400">{l.field ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-steel-500">{l.userId ?? "system"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-steel-500">No audit entries yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
