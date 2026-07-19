import Link from "next/link";
import { requireAuthWithPermission } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { PageHeader, Panel, MetricCard, FinancialMetric } from "@/components/ui/primitives";
import { getCeoBrief } from "@/server/services/ceo";

const SEV_STYLE: Record<string, { dot: string; text: string; label: string }> = {
  critical: { dot: "bg-status-critical", text: "text-status-critical", label: "Critical" },
  attention: { dot: "bg-status-attention", text: "text-status-attention", label: "Attention" },
  info: { dot: "bg-status-info", text: "text-paper-steel", label: "Info" },
  good: { dot: "bg-status-healthy", text: "text-status-healthy", label: "Good" },
};

export default async function CeoPage() {
  const ctx = await requireAuthWithPermission("ceo:dashboard");
  const { brief, inputs, cash, exposure, forecastPreview } = await getCeoBrief(ctx);
  const openItems = brief.filter((b) => b.severity !== "good").length;

  return (
    <div>
      <PageHeader
        eyebrow="Executive · Confidential"
        title="CEO Command Center"
        subtitle={`Welcome, ${ctx.name}. ${openItems === 0 ? "No exceptions flagged." : `${openItems} item${openItems === 1 ? "" : "s"} need your attention.`}`}
      />

      {/* Cash posture */}
      {cash ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard label="Available Cash" value={formatCents(cash.availableOperatingCents)} accent="financial" tone={cash.availableOperatingCents >= 0 ? "healthy" : "risk"} />
          <FinancialMetric label="Protected Reserve" cents={cash.protectedReserveCents} hint="Household reserve" />
          <FinancialMetric label="30-Day Net" cents={cash.net30Cents} signed />
          <MetricCard label="Cash Trough" value={inputs.cashTroughCents != null ? formatCents(inputs.cashTroughCents) : "—"} tone={(inputs.cashTroughCents ?? 0) < 0 ? "risk" : "healthy"} hint={inputs.runwayMonths != null ? `runway ${inputs.runwayMonths} mo` : "12+ mo runway"} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><MetricCard label="Cash" value={<span className="text-sm text-paper-muted">Finance access required</span>} /></div>
      )}

      {/* Monday Morning CEO Brief */}
      <Panel className="mt-6" title="Monday Morning CEO Brief" accent="neutral">
        <div className="space-y-2">
          {brief.map((item, i) => {
            const s = SEV_STYLE[item.severity];
            return (
              <div key={i} className="flex items-start gap-3 rounded border border-bg-gunmetal bg-bg-charcoal/30 px-3 py-2">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                <div className="min-w-0">
                  <span className={`text-[11px] font-semibold uppercase tracking-wide ${s.text}`}>{item.area}</span>
                  <p className="text-sm text-paper-steel">{item.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Operational posture */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Builds & Risk" accent="risk">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Over Budget" value={inputs.buildsOverBudget} tone={inputs.buildsOverBudget ? "attention" : "healthy"} />
            <MetricCard label="Builds at Risk" value={inputs.buildsAtRisk} tone={inputs.buildsAtRisk ? "risk" : "healthy"} />
            <MetricCard label="Open Risks" value={inputs.openRisks} tone={inputs.openRisks ? "attention" : "healthy"} />
            <MetricCard label="Critical Risks" value={inputs.criticalRisks} tone={inputs.criticalRisks ? "risk" : "healthy"} />
          </div>
          {exposure && exposure.cashImpactCents !== 0 && (
            <p className="mt-3 text-xs text-paper-muted">Modeled cash at risk: <span className="text-paper-warm">{formatCents(exposure.cashImpactCents)}</span> · <Link href="/os/risk" className="text-rust-400 hover:underline">open register →</Link></p>
          )}
        </Panel>

        <Panel title="Obligations" accent="sponsor">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Sponsor Due" value={inputs.sponsorDeliverablesDueSoon} tone={inputs.sponsorDeliverablesDueSoon ? "attention" : "healthy"} />
            <MetricCard label="Sponsor Overdue" value={inputs.sponsorDeliverablesOverdue} tone={inputs.sponsorDeliverablesOverdue ? "risk" : "healthy"} />
            <MetricCard label="Giveaways Blocked" value={inputs.giveawaysBlocked} tone={inputs.giveawaysBlocked ? "attention" : "healthy"} />
            <MetricCard label="Social in Review" value={inputs.socialInReview} />
          </div>
        </Panel>

        <Panel title="6-Month Cash Preview" accent="financial">
          {forecastPreview ? (
            <table className="data-table">
              <thead><tr><th>Month</th><th className="num">Ending</th></tr></thead>
              <tbody>
                {forecastPreview.buckets.map((b) => (
                  <tr key={b.month}>
                    <td>{new Date(b.month + "-01T00:00:00Z").toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" })}</td>
                    <td className={`num ${b.endingBalanceCents >= 0 ? "text-paper-warm" : "text-status-critical"}`}>{formatCents(b.endingBalanceCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-paper-muted">Finance access required.</p>
          )}
          <p className="mt-3 text-xs text-paper-muted"><Link href="/os/forecast" className="text-rust-400 hover:underline">Run what-if scenarios →</Link></p>
        </Panel>
      </div>

      <p className="mt-4 text-xs text-paper-muted">
        The brief prioritizes cross-domain exceptions worst-first from live cash, risk, build, sponsor,
        giveaway, content, and commerce data. This command center is confidential (ceo:dashboard).
      </p>
    </div>
  );
}
