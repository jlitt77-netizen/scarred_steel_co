import { requireAuthWithPermission } from "@/lib/auth";
import { listSettings } from "@/server/services/settings";
import { PageHeader } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";

type Row = Awaited<ReturnType<typeof listSettings>>[number];

export default async function SettingsPage() {
  const ctx = await requireAuthWithPermission("settings:read");
  const settings = await listSettings(ctx);

  const columns: Column<Row>[] = [
    { key: "key", header: "Key", render: (s) => <span className="font-mono text-paper-steel">{s.key}</span> },
    { key: "value", header: "Value", render: (s) => <span className="text-paper-warm">{s.value}</span> },
    { key: "cat", header: "Category", render: (s) => <span className="badge">{s.category}</span> },
    { key: "desc", header: "Description", render: (s) => <span className="text-paper-muted">{s.description}</span> },
  ];

  return (
    <div>
      <PageHeader eyebrow="System" title="Settings" subtitle="Application configuration." />
      <DataTable columns={columns} rows={settings} getKey={(s) => s.id} empty="No settings." />
    </div>
  );
}
