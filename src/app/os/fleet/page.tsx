import { requireAuthWithPermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { formatCents } from "@/lib/money";
import { PageHeader, Panel, MetricCard } from "@/components/ui/primitives";
import { listFleet, getFleetSummary, listVehiclesForSelect } from "@/server/services/fleet";
import { AssessButton } from "./FleetForm";

const RECO_TONE: Record<string, string> = {
  KEEP: "text-status-healthy",
  "REVIEW ANNUALLY": "text-status-attention",
  "SELL CANDIDATE": "text-status-critical",
};

export default async function FleetPage() {
  const ctx = await requireAuthWithPermission("vehicle:read");
  const canWrite = can(ctx, "vehicle:write");

  const [summary, fleet] = await Promise.all([getFleetSummary(ctx), listFleet(ctx)]);
  const vehicles = canWrite ? await listVehiclesForSelect(ctx) : [];

  return (
    <div>
      <PageHeader
        eyebrow="Portfolio"
        title="Fleet & Long-Term Assets"
        subtitle="Keep-vs-sell across cost and brand/media value — KEEP · REVIEW ANNUALLY · SELL CANDIDATE."
        actions={canWrite ? <AssessButton vehicles={vehicles} /> : undefined}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Keep" value={summary.tally["KEEP"] ?? 0} tone="healthy" />
        <MetricCard label="Review Annually" value={summary.tally["REVIEW ANNUALLY"] ?? 0} tone="attention" />
        <MetricCard label="Sell Candidates" value={summary.tally["SELL CANDIDATE"] ?? 0} tone={(summary.tally["SELL CANDIDATE"] ?? 0) > 0 ? "risk" : "healthy"} />
        <MetricCard label="Net Annual Value" value={formatCents(summary.netAnnualCents)} accent="financial" hint={`${formatCents(summary.investedCents)} invested`} />
      </div>

      <Panel className="mt-6" title="Fleet">
        <div className="scroll-steel overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th><th>Class</th><th>Status</th>
                <th className="num">Invested</th><th className="num">Market</th>
                <th className="num">Annual Cost</th><th className="num">Annual Value</th><th className="num">Net</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {fleet.map((f) => (
                <tr key={f.id}>
                  <td className="text-paper-warm">{f.label}{f.nickname && <span className="ml-2 text-xs text-paper-muted">“{f.nickname}”</span>}</td>
                  <td className="text-paper-muted">{f.classification ?? "—"}</td>
                  <td className="text-paper-muted">{f.status}</td>
                  <td className="num">{formatCents(f.trueCashInvestedCents)}</td>
                  <td className="num">{f.currentMarketValueCents != null ? formatCents(f.currentMarketValueCents) : "—"}</td>
                  <td className="num text-cal-cash">{f.hasAssessment ? formatCents(f.annualCostCents) : "—"}</td>
                  <td className="num text-status-gain">{f.hasAssessment ? formatCents(f.annualValueCents) : "—"}</td>
                  <td className={`num ${f.netAnnualCents >= 0 ? "text-status-gain" : "text-status-loss"}`}>{f.hasAssessment ? formatCents(f.netAnnualCents) : "—"}</td>
                  <td>
                    <span className={`badge font-semibold ${RECO_TONE[f.recommendation]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${f.recommendation === "KEEP" ? "bg-status-healthy" : f.recommendation === "SELL CANDIDATE" ? "bg-status-critical" : "bg-status-attention"}`} />
                      {f.recommendation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="mt-4 text-xs text-paper-muted">
        Invested cash reuses the shared vehicle economics (acquisition + build − sponsor offsets). Add an
        assessment to model a vehicle&apos;s annual carrying cost against the media, sponsor, affiliate,
        merch, event, and brand value it generates. Vehicles without an assessment default to REVIEW ANNUALLY.
      </p>
    </div>
  );
}
