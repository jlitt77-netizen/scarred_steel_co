import { requireAuthWithPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import type { AuditLog } from "@prisma/client";

export default async function AuditPage() {
  await requireAuthWithPermission("audit:read");
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  const columns: Column<AuditLog>[] = [
    { key: "when", header: "When", render: (l) => <span className="tnum text-paper-muted">{l.createdAt.toISOString().replace("T", " ").slice(0, 19)}</span> },
    { key: "entity", header: "Entity", render: (l) => <span className="text-paper-steel">{l.entityType}</span> },
    { key: "action", header: "Action", render: (l) => <span className="badge">{l.action}</span> },
    { key: "field", header: "Field", render: (l) => <span className="text-paper-muted">{l.field ?? "—"}</span> },
    { key: "user", header: "User", render: (l) => <span className="font-mono text-xs text-paper-muted">{l.userId ?? "system"}</span> },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="System"
        title="Audit & History"
        subtitle="Most recent 100 material changes. Nothing important moves silently."
      />
      <DataTable columns={columns} rows={logs} getKey={(l) => l.id} empty="No audit entries yet." />
    </div>
  );
}
