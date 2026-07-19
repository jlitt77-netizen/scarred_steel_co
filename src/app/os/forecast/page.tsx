import { requireAuthWithPermission } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { PageHeader, Panel, MetricCard } from "@/components/ui/primitives";
import { getForecastScenarios } from "@/server/services/forecast";

function monthLabel(m: string) {
  return new Date(m + "-01T00:00:00Z").toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
}
function runwayText(runwayMonths: number | null) {
  return runwayMonths == null ? "12+ mo" : `${runwayMonths} mo`;
}
function delta(scenarioCents: number, baseCents: number) {
  const d = scenarioCents - baseCents;
  return `${d >= 0 ? "+" : ""}${formatCents(d)}`;
}

export default async function ForecastPage() {
  const ctx = await requireAuthWithPermission("forecast:read");
  const { base, scenarios } = await getForecastScenarios(ctx);
  const maxAbs = Math.max(1, ...base.buckets.map((b) => Math.abs(b.endingBalanceCents)));

  return (
    <div>
      <PageHeader
        eyebrow="Executive · Confidential"
        title="Master Forecast & Scenario"
        subtitle="What-if modeling on the 12-month rolling cash forecast — ending balance, cash trough, and runway."
      />

      {/* Base */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Base Ending (12mo)" value={formatCents(base.endingCents)} accent="financial" tone={base.endingCents >= 0 ? "healthy" : "risk"} />
        <MetricCard label="Cash Trough" value={base.trough ? formatCents(base.trough.balanceCents) : "—"} tone={(base.trough?.balanceCents ?? 0) < 0 ? "risk" : "healthy"} hint={base.trough ? monthLabel(base.trough.month) : undefined} />
        <MetricCard label="Runway" value={runwayText(base.runwayMonths)} tone={base.runwayMonths == null ? "healthy" : "risk"} />
        <MetricCard label="Scenarios" value={scenarios.length} />
      </div>

      {/* Base forecast bars */}
      <Panel className="mt-6" title="Base · 12-Month Rolling Forecast" accent="financial">
        <div className="scroll-steel overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Month</th><th className="num">Net</th><th className="num">Ending Balance</th><th className="w-40">Balance</th></tr></thead>
            <tbody>
              {base.buckets.map((b) => (
                <tr key={b.month}>
                  <td>{monthLabel(b.month)}</td>
                  <td className={`num ${b.netCents >= 0 ? "text-status-gain" : "text-status-loss"}`}>{b.netCents ? `${b.netCents >= 0 ? "+" : ""}${formatCents(b.netCents)}` : "—"}</td>
                  <td className={`num font-medium ${b.endingBalanceCents >= 0 ? "text-paper-warm" : "text-status-critical"}`}>{formatCents(b.endingBalanceCents)}</td>
                  <td>
                    <div className="h-2 w-36 rounded bg-bg-gunmetal">
                      <div className={`h-full rounded ${b.endingBalanceCents >= 0 ? "bg-status-gain" : "bg-status-critical"}`} style={{ width: `${Math.round((Math.abs(b.endingBalanceCents) / maxAbs) * 100)}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Scenario comparison */}
      <Panel className="mt-6" title="What-If Scenarios vs Base">
        <div className="scroll-steel overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Scenario</th><th className="num">Ending (12mo)</th><th className="num">Δ vs base</th>
                <th className="num">Cash Trough</th><th className="num">Runway</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b-2 border-bg-panel">
                <td className="font-semibold text-paper-warm">Base (no change)</td>
                <td className="num text-paper-warm">{formatCents(base.endingCents)}</td>
                <td className="num text-paper-muted">—</td>
                <td className={`num ${(base.trough?.balanceCents ?? 0) < 0 ? "text-status-loss" : "text-paper-warm"}`}>{base.trough ? formatCents(base.trough.balanceCents) : "—"}</td>
                <td className="num">{runwayText(base.runwayMonths)}</td>
              </tr>
              {scenarios.map((s) => {
                const worse = s.result.endingCents < base.endingCents;
                const negTrough = (s.result.trough?.balanceCents ?? 0) < 0;
                return (
                  <tr key={s.key}>
                    <td>
                      <div className="text-paper-warm">{s.label}</div>
                      <div className="text-xs text-paper-muted">{s.description}</div>
                    </td>
                    <td className={`num ${s.result.endingCents >= 0 ? "text-paper-warm" : "text-status-critical"}`}>{formatCents(s.result.endingCents)}</td>
                    <td className={`num ${worse ? "text-status-loss" : "text-status-gain"}`}>{delta(s.result.endingCents, base.endingCents)}</td>
                    <td className={`num ${negTrough ? "text-status-critical" : "text-paper-muted"}`}>{s.result.trough ? formatCents(s.result.trough.balanceCents) : "—"}</td>
                    <td className={`num ${s.result.runwayMonths != null ? "text-status-critical" : "text-status-gain"}`}>{runwayText(s.result.runwayMonths)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="mt-4 text-xs text-paper-muted">
        Scenarios apply one-time cash events, recurring monthly deltas, or revenue haircuts to the live base
        forecast and recompute ending balance, cash trough, and runway (first month cash goes negative).
        &quot;Lose top sponsor&quot; and &quot;buy a vehicle&quot; pull from live CRM and Finds data.
      </p>
    </div>
  );
}
