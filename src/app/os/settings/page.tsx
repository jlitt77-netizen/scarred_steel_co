import { requireAuthWithPermission } from "@/lib/auth";
import { listSettings } from "@/server/services/settings";

export default async function SettingsPage() {
  const ctx = await requireAuthWithPermission("settings:read");
  const settings = await listSettings(ctx);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-2xl font-bold text-steel-100">Settings</h1>
      <p className="mb-6 text-steel-400">Application configuration.</p>

      <div className="overflow-hidden rounded-lg border border-steel-800">
        <table className="w-full text-sm">
          <thead className="bg-steel-900 text-left text-xs uppercase tracking-wide text-steel-500">
            <tr>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-steel-800">
            {settings.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-mono text-steel-200">{s.key}</td>
                <td className="px-4 py-3 text-steel-100">{s.value}</td>
                <td className="px-4 py-3"><span className="badge">{s.category}</span></td>
                <td className="px-4 py-3 text-steel-400">{s.description}</td>
              </tr>
            ))}
            {settings.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-steel-500">No settings.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
