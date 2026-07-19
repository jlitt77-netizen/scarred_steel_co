import Link from "next/link";
import { requireInternal } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  PageHeader,
  Panel,
  MetricCard,
  FinancialMetric,
  RiskBadge,
  StatusBadge,
  CapacityMeter,
} from "@/components/ui/primitives";
import { getCashSummary } from "@/server/services/finance";
import { formatCents } from "@/lib/money";
import { IconChevron } from "@/components/ui/icons";

// Legit placeholder marker for metrics owned by a later phase.
function Pending({ phase }: { phase: number }) {
  return <span className="text-xs text-paper-muted">— · Phase {phase}</span>;
}

export default async function OsHome() {
  const ctx = await requireInternal();
  const canFinance = can(ctx, "finance:read");
  const canRisk = can(ctx, "risk:read");
  const canSchedule = can(ctx, "event:read") || can(ctx, "calendar:read");
  const now = new Date();

  const [vehicles, projects, tasks, openRisks, upcomingRevenue, cash] =
    await Promise.all([
      prisma.vehicle.findMany({ orderBy: { updatedAt: "desc" } }),
      prisma.project.findMany({ include: { vehicle: true } }),
      prisma.task.count(),
      canRisk
        ? prisma.risk.findMany({
            where: { status: { in: ["open", "mitigating"] } },
            orderBy: { severity: "desc" },
            include: { vehicle: true, project: true },
          })
        : Promise.resolve([]),
      canSchedule
        ? prisma.event.findMany({
            where: { revenueDate: { gte: now } },
            orderBy: { revenueDate: "asc" },
            take: 5,
          })
        : Promise.resolve([]),
      canFinance ? getCashSummary(ctx) : Promise.resolve(null),
    ]);

  const activeBuilds = projects.filter((p) => p.status === "Active").length;
  const overBudget = projects.filter(
    (p) => p.budgetCents != null && p.actualCostCents != null && p.actualCostCents > p.budgetCents,
  ).length;
  const buildsAtRisk = new Set(openRisks.map((r) => r.projectId).filter(Boolean)).size;

  return (
    <div>
      <PageHeader
        eyebrow="Executive"
        title="CEO Command Center"
        subtitle={`Welcome, ${ctx.name}. What needs your attention right now.`}
      />

      {/* TOP ROW — cash posture */}
      {cash ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <MetricCard label="Available Cash" value={formatCents(cash.availableOperatingCents)} accent="financial" />
          <FinancialMetric label="Protected Reserve" cents={cash.protectedReserveCents} hint="Household reserve" />
          <FinancialMetric label="30-Day Cash Out" cents={cash.committedOutflow30Cents} />
          <FinancialMetric label="30-Day Revenue In" cents={cash.expectedInflow30Cents} />
          <FinancialMetric label="Net 30-Day Change" cents={cash.net30Cents} signed />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <MetricCard label="Cash Posture" value={<span className="text-sm text-paper-muted">Finance access required</span>} />
        </div>
      )}

      {/* SECOND ROW — operational posture */}
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
        <MetricCard label="Active Builds" value={activeBuilds} accent="vehicle" />
        <MetricCard label="Builds at Risk" value={buildsAtRisk} tone={buildsAtRisk ? "risk" : "healthy"} accent="risk" />
        <MetricCard label="Over-Budget Projects" value={overBudget} tone={overBudget ? "attention" : "healthy"} />
        <MetricCard label="Sponsor Deliverables Due" value={<Pending phase={7} />} />
        <MetricCard label="Customer Approvals" value={<Pending phase={11} />} />
      </div>

      {/* MAIN AREA */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel accent="neutral" title="Master Operating Timeline">
          <p className="text-sm text-paper-muted">
            The unified work / cash / content / revenue timeline lands in Phase 2.
          </p>
          <Link href="/os/calendar" className="btn-ghost mt-3 px-0 text-rust-400">
            Open Master Calendar <IconChevron />
          </Link>
        </Panel>

        <Panel accent="financial" title="Cash Flow Forecast">
          {cash ? (
            <>
              <div className="text-sm text-paper-steel">Next 30 days</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className={`font-display text-2xl tnum ${cash.net30Cents >= 0 ? "text-status-gain" : "text-status-loss"}`}>
                  {cash.net30Cents >= 0 ? "+" : ""}{formatCents(cash.net30Cents)}
                </span>
                <span className="text-xs text-paper-muted">net</span>
              </div>
              <div className="mt-1 text-xs text-paper-muted tnum">
                in {formatCents(cash.expectedInflow30Cents)} · out {formatCents(cash.committedOutflow30Cents)}
              </div>
              <Link href="/os/finance" className="btn-ghost mt-3 px-0 text-rust-400">
                Open Financial Command Center <IconChevron />
              </Link>
            </>
          ) : (
            <p className="text-sm text-paper-muted">Requires finance access.</p>
          )}
        </Panel>

        <Panel accent="risk" title="Risk & Decision Queue">
          {!canRisk ? (
            <p className="text-sm text-paper-muted">Risk center is restricted.</p>
          ) : openRisks.length === 0 ? (
            <p className="text-sm text-paper-muted">No open risks. All clear.</p>
          ) : (
            <ul className="space-y-2">
              {openRisks.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm text-paper-warm">{r.title}</div>
                    <div className="text-xs text-paper-muted">
                      {r.category}
                      {r.vehicle ? ` · ${r.vehicle.year} ${r.vehicle.model}` : ""}
                    </div>
                  </div>
                  <RiskBadge severity={r.severity} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* LOWER AREA */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel accent="vehicle" title="Build Portfolio" className="lg:col-span-2">
          <div className="space-y-2">
            {vehicles.slice(0, 6).map((v) => (
              <Link
                key={v.id}
                href={`/os/vehicles/${v.id}`}
                className="flex items-center justify-between rounded border border-transparent px-2 py-1.5 hover:border-bg-gunmetal hover:bg-bg-charcoal"
              >
                <span className="text-sm text-paper-warm">
                  {v.year} {v.make} {v.model}
                  {v.nickname ? ` · "${v.nickname}"` : ""}
                </span>
                <StatusBadge status={v.status} />
              </Link>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-paper-muted">
            <span>{vehicles.length} vehicles</span>
            <span>{projects.length} projects</span>
            <span>{tasks} tasks</span>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel accent="financial" title="Upcoming Revenue">
            {!canSchedule ? (
              <p className="text-sm text-paper-muted">Restricted.</p>
            ) : upcomingRevenue.length === 0 ? (
              <p className="text-sm text-paper-muted">No scheduled revenue.</p>
            ) : (
              <ul className="space-y-1.5">
                {upcomingRevenue.map((e) => (
                  <li key={e.id} className="flex items-center justify-between text-sm">
                    <span className="truncate text-paper-steel">{e.title}</span>
                    <span className="ml-2 shrink-0 tnum text-status-gain">
                      {e.amountCents != null ? formatCents(e.amountCents) : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Capacity">
            <div className="space-y-3">
              <CapacityMeter label="Team (Phase 5)" percent={0} />
              <CapacityMeter label="Partner Shop (Phase 5)" percent={0} />
            </div>
            <p className="mt-2 text-xs text-paper-muted">Live capacity lands in Phase 5.</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
