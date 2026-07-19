import { requireAuthWithPermission } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { PageHeader, Panel, EmptyState } from "@/components/ui/primitives";
import { getMyGarage } from "@/server/services/portal";

export default async function DigitalPortalPage() {
  const ctx = await requireAuthWithPermission("portal:digital");
  const { products, affiliates } = await getMyGarage(ctx);

  return (
    <div>
      <PageHeader
        eyebrow="Digital Products"
        title="My Garage"
        subtitle="Your blueprints and build guides, plus the parts and kits to build along."
        textured={false}
      />

      <Panel title="Blueprints & Guides" accent="media">
        {products.length === 0 ? (
          <EmptyState title="Nothing here yet" description="Purchased blueprints and guides will appear in your garage." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="panel accent-bar border-l-cal-content p-4">
                <div className="text-[11px] uppercase tracking-wide text-paper-muted">{p.type}</div>
                <div className="mt-1 font-display text-lg text-paper-warm">{p.name}</div>
                {p.description && <p className="mt-1 text-xs text-paper-muted">{p.description}</p>}
                <div className="mt-2 text-sm">{p.priceCents ? <span className="text-paper-steel">{formatCents(p.priceCents)}</span> : <span className="text-status-gain">Free</span>}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel className="mt-6" title="Build Kits & Affiliate Shopping">
        {affiliates.length === 0 ? (
          <p className="text-sm text-paper-muted">No products linked yet.</p>
        ) : (
          <div className="scroll-steel overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Product</th><th>Vendor</th><th></th></tr></thead>
              <tbody>
                {affiliates.map((a) => (
                  <tr key={a.id}>
                    <td className="text-paper-warm">{a.name}</td>
                    <td className="text-paper-muted">{a.vendor ?? "—"}</td>
                    <td>{a.url ? <a href={a.url} target="_blank" rel="noreferrer" className="text-rust-400 hover:underline">Shop →</a> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="mt-4 text-xs text-paper-muted">
        The interactive Build Planner and saved-build library expand this garage in a later release. Affiliate
        links support the channel at no extra cost to you.
      </p>
    </div>
  );
}
