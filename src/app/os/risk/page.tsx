import { requireAuthWithPermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { formatCents } from "@/lib/money";
import { PageHeader, Panel, MetricCard, RiskBadge, EmptyState } from "@/components/ui/primitives";
import { getRiskRegister } from "@/server/services/risks";
import { AddRiskButton, RiskStatusSelect } from "./RiskForms";

function signedCents(c: number | null | undefined) {
  if (c == null || c === 0) return "—";
  return `${c > 0 ? "+" : ""}${formatCents(c)}`;
}

export default async function RiskPage() {
  const ctx = await requireAuthWithPermission("risk:read");
  const canWrite = can(ctx, "risk:write");
  const { risks, exposure, exceptions } = await getRiskRegister(ctx);

  return (
    <div>
      <PageHeader
        eyebrow="Executive · Confidential"
        title="Risk, Decisions & Exceptions"
        subtitle="Confidential register with modeled schedule, cost, revenue, and cash impact before you approve a response."
        actions={canWrite ? <AddRiskButton /> : undefined}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Open Risks" value={exposure.openCount} tone={exposure.openCount > 0 ? "attention" : "healthy"} accent="risk" />
        <MetricCard label="Critical" value={exposure.criticalCount} tone={exposure.criticalCount > 0 ? "risk" : "healthy"} />
        <MetricCard label="Cash at Risk" value={signedCents(exposure.cashImpactCents)} accent="financial" />
        <MetricCard label="Schedule at Risk" value={`${exposure.scheduleImpactDays} d`} hint={`${exposure.costImpactCents ? formatCents(exposure.costImpactCents) : "$0"} cost`} />
      </div>

      {/* Exception queue — highest-priority open risks */}
      {exceptions.length > 0 && (
        <Panel className="mt-6" title="Exception Queue · needs a decision" accent="risk">
          <div className="space-y-2">
            {exceptions.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-bg-gunmetal bg-bg-charcoal/40 px-3 py-2">
                <div className="flex items-center gap-3">
                  <RiskBadge severity={r.severity} />
                  <span className="text-paper-warm">{r.title}</span>
                  <span className="text-xs text-paper-muted">{r.category}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-paper-muted">
                  {r.responseOption && <span className="text-paper-steel">→ {r.responseOption}</span>}
                  {r.cashImpactCents ? <span className={r.cashImpactCents >= 0 ? "text-status-gain" : "text-status-loss"}>{signedCents(r.cashImpactCents)} cash</span> : null}
                  {r.scheduleImpactDays ? <span>{r.scheduleImpactDays}d</span> : null}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Full register */}
      <Panel className="mt-6" title="Risk Register">
        {risks.length === 0 ? (
          <EmptyState title="No risks logged" description="Log a risk to model its response impact before deciding." />
        ) : (
          <div className="scroll-steel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Risk</th><th>Category</th><th>Severity</th><th className="num">Score</th>
                  <th>Response</th><th className="num">Schedule</th><th className="num">Cost</th>
                  <th className="num">Revenue</th><th className="num">Cash</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {risks.map((r) => (
                  <tr key={r.id}>
                    <td className="text-paper-warm">
                      {r.title}
                      {r.project?.name && <span className="ml-2 text-xs text-paper-muted">{r.project.name}</span>}
                    </td>
                    <td className="text-paper-muted">{r.category}</td>
                    <td><RiskBadge severity={r.severity} /></td>
                    <td className="num tnum text-paper-steel">{r.score}</td>
                    <td className="text-paper-muted">{r.responseOption ?? "—"}</td>
                    <td className="num">{r.scheduleImpactDays != null ? `${r.scheduleImpactDays}d` : "—"}</td>
                    <td className="num">{r.costImpactCents != null ? formatCents(r.costImpactCents) : "—"}</td>
                    <td className={`num ${(r.revenueImpactCents ?? 0) < 0 ? "text-status-loss" : ""}`}>{r.revenueImpactCents != null ? signedCents(r.revenueImpactCents) : "—"}</td>
                    <td className={`num ${(r.cashImpactCents ?? 0) < 0 ? "text-status-loss" : (r.cashImpactCents ?? 0) > 0 ? "text-status-gain" : ""}`}>{r.cashImpactCents != null ? signedCents(r.cashImpactCents) : "—"}</td>
                    <td>{canWrite ? <RiskStatusSelect id={r.id} status={r.status} /> : r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="mt-4 text-xs text-paper-muted">
        Priority score = severity × likelihood (1–12); the exception queue surfaces open risks scoring 6+.
        Impact figures preview what the chosen response would do to schedule, cost, revenue, and cash before
        you approve it. This register is confidential (risk:read).
      </p>
    </div>
  );
}
