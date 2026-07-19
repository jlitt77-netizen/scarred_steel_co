import { requireAuthWithPermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { formatCents } from "@/lib/money";
import { PageHeader, Panel, MetricCard } from "@/components/ui/primitives";
import {
  getCashPosition, getForecast, listReceivables, listPayables, getPnl, getBudgetVsActual,
} from "@/server/services/finance";
import { AddReceivableButton, AddPayableButton } from "./FinanceForms";

function monthLabel(m: string) {
  return new Date(m + "-01T00:00:00Z").toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
}
function signed(cents: number) {
  return `${cents >= 0 ? "+" : ""}${formatCents(cents)}`;
}

export default async function FinancePage() {
  const ctx = await requireAuthWithPermission("finance:read");
  const canWrite = can(ctx, "finance:write");

  const [pos, forecast, ar, ap, pnl, bva] = await Promise.all([
    getCashPosition(ctx), getForecast(ctx, 12), listReceivables(ctx), listPayables(ctx), getPnl(ctx), getBudgetVsActual(ctx),
  ]);

  const maxBal = Math.max(1, ...forecast.buckets.map((b) => Math.abs(b.endingBalanceCents)));

  return (
    <div>
      <PageHeader
        eyebrow="Finance · Confidential"
        title="Financial Command Center"
        subtitle="Cash, receivables, payables, the rolling forecast, and P&L by segment."
        actions={canWrite ? <div className="flex gap-2"><AddReceivableButton /><AddPayableButton /></div> : undefined}
      />

      {/* Cash position */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Available Operating" value={formatCents(pos.availableOperatingCents)} accent="financial" />
        <MetricCard label="Protected Reserve" value={formatCents(pos.protectedReserveCents)} />
        <MetricCard label="Total Cash" value={formatCents(pos.totalCents)} />
        <MetricCard label="Open A/R − A/P" value={formatCents(ar.openCents - ap.openCents)} tone={ar.openCents - ap.openCents >= 0 ? "healthy" : "risk"} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {pos.accounts.map((a) => (
          <div key={a.id} className="panel p-3">
            <div className="text-[11px] uppercase tracking-wide text-paper-muted">{a.type}</div>
            <div className="tnum mt-0.5 font-display text-xl text-paper-warm">{formatCents(a.balanceCents)}</div>
            <div className="text-xs text-paper-muted">{a.name}</div>
          </div>
        ))}
      </div>

      {/* Rolling forecast */}
      <Panel className="mt-6" title="12-Month Rolling Cash Forecast" accent="financial">
        <p className="mb-3 text-sm text-paper-muted">
          Opening {formatCents(forecast.openingCents)}
          {forecast.trough && <> · projected low <span className="text-status-attention">{formatCents(forecast.trough.balanceCents)}</span> in {monthLabel(forecast.trough.month)}</>}
        </p>
        <div className="scroll-steel overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Month</th><th className="num">Cash In</th><th className="num">Cash Out</th><th className="num">Net</th><th className="num">Ending Balance</th><th className="w-40">Balance</th></tr></thead>
            <tbody>
              {forecast.buckets.map((b) => (
                <tr key={b.month}>
                  <td>{monthLabel(b.month)}</td>
                  <td className="num text-status-gain">{b.inflowCents ? formatCents(b.inflowCents) : "—"}</td>
                  <td className="num text-cal-cash">{b.outflowCents ? formatCents(b.outflowCents) : "—"}</td>
                  <td className={`num ${b.netCents >= 0 ? "text-status-gain" : "text-status-loss"}`}>{b.netCents ? signed(b.netCents) : "—"}</td>
                  <td className={`num font-medium ${b.endingBalanceCents >= 0 ? "text-paper-warm" : "text-status-critical"}`}>{formatCents(b.endingBalanceCents)}</td>
                  <td>
                    <div className="h-2 w-36 rounded bg-bg-gunmetal">
                      <div className={`h-full rounded ${b.endingBalanceCents >= 0 ? "bg-status-gain" : "bg-status-critical"}`} style={{ width: `${Math.round((Math.abs(b.endingBalanceCents) / maxBal) * 100)}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* A/R and A/P */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title={`Accounts Receivable · open ${formatCents(ar.openCents)}${ar.overdueCents ? ` · overdue ${formatCents(ar.overdueCents)}` : ""}`}>
          <ArApTable rows={ar.rows.map((r) => ({ id: r.id, label: r.type, desc: r.description, amountCents: r.amountCents, dueDate: r.dueDate, status: r.status, overdue: r.overdue }))} />
        </Panel>
        <Panel title={`Accounts Payable · open ${formatCents(ap.openCents)}${ap.overdueCents ? ` · overdue ${formatCents(ap.overdueCents)}` : ""}`}>
          <ArApTable rows={ap.rows.map((r) => ({ id: r.id, label: r.category, desc: r.vendor ?? r.description, amountCents: r.amountCents, dueDate: r.scheduledCashDate ?? r.dueDate, status: r.status, overdue: r.overdue }))} />
        </Panel>
      </div>

      {/* Budget vs actual + P&L */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Build Budget vs Actual" accent="vehicle">
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Budget" value={formatCents(bva.totals.budgetCents)} />
            <MetricCard label="Actual" value={formatCents(bva.totals.actualCents)} />
            <MetricCard label="Variance" value={formatCents(bva.totals.varianceCents)} tone={bva.totals.varianceCents >= 0 ? "healthy" : "risk"} />
          </div>
          <table className="data-table mt-3">
            <thead><tr><th>Category</th><th className="num">Budget</th><th className="num">Actual</th><th className="num">Var</th></tr></thead>
            <tbody>
              {bva.categories.slice(0, 8).map((c) => (
                <tr key={c.category}>
                  <td>{c.category}</td>
                  <td className="num">{formatCents(c.budgetCents)}</td>
                  <td className="num">{formatCents(c.actualCents)}</td>
                  <td className={`num ${c.varianceCents >= 0 ? "text-status-gain" : "text-status-loss"}`}>{formatCents(c.varianceCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="P&L by Segment (realized)">
          <table className="data-table">
            <thead><tr><th>Segment</th><th className="num">Revenue</th><th className="num">Expense</th><th className="num">Net</th></tr></thead>
            <tbody>
              {pnl.segments.map((s) => (
                <tr key={s.segment}>
                  <td>{s.segment}</td>
                  <td className="num text-status-gain">{formatCents(s.revenueCents)}</td>
                  <td className="num text-cal-cash">{formatCents(s.expenseCents)}</td>
                  <td className={`num font-medium ${s.netCents >= 0 ? "text-status-gain" : "text-status-loss"}`}>{signed(s.netCents)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-bg-panel">
                <td className="font-semibold text-paper-warm">Total</td>
                <td className="num text-status-gain">{formatCents(pnl.totals.revenueCents)}</td>
                <td className="num text-cal-cash">{formatCents(pnl.totals.expenseCents)}</td>
                <td className={`num font-semibold ${pnl.totals.netCents >= 0 ? "text-status-gain" : "text-status-loss"}`}>{signed(pnl.totals.netCents)}</td>
              </tr>
            </tbody>
          </table>
        </Panel>
      </div>

      <p className="mt-4 text-xs text-paper-muted">
        Daily/weekly/quarterly granularity and automated revenue attribution build on this
        foundation in later passes. Forecast reflects open A/R, unpaid A/P, and scheduled
        event cash/revenue dates.
      </p>
    </div>
  );
}

function ArApTable({ rows }: { rows: { id: string; label: string; desc: string; amountCents: number; dueDate: Date | null; status: string; overdue: boolean }[] }) {
  if (rows.length === 0) return <p className="text-sm text-paper-muted">Nothing outstanding.</p>;
  return (
    <div className="scroll-steel overflow-x-auto">
      <table className="data-table">
        <thead><tr><th>Type</th><th>Detail</th><th className="num">Amount</th><th>Due</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="text-paper-steel">{r.label}</td>
              <td className="text-paper-muted">{r.desc}</td>
              <td className="num text-paper-warm">{formatCents(r.amountCents)}</td>
              <td className="text-paper-muted">{r.dueDate ? r.dueDate.toISOString().slice(0, 10) : "—"}</td>
              <td>
                <span className={`badge ${r.overdue ? "text-status-critical" : ""}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${r.overdue ? "bg-status-critical" : r.status === "paid" || r.status === "received" ? "bg-status-healthy" : "bg-status-info"}`} />
                  {r.overdue ? "overdue" : r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
