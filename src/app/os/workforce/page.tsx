import { requireAuthWithPermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { formatCents } from "@/lib/money";
import { PageHeader, Panel, MetricCard, StatusBadge } from "@/components/ui/primitives";
import { listTeamMembers, getScenarios } from "@/server/services/workforce";
import { AddTeamMemberButton } from "./TeamForm";

export default async function WorkforcePage() {
  const ctx = await requireAuthWithPermission("project:read");
  const canWrite = can(ctx, "project:write");
  const canFinance = can(ctx, "finance:read");

  const members = await listTeamMembers(ctx);
  // Scenario modeling + compensation amounts are confidential (Section 32).
  const scenarios = canFinance ? await getScenarios(ctx) : null;

  const monthlyLaborCents = members.reduce((s, m) => s + m.monthlyCostCents, 0);
  const employees = members.filter((m) => m.engagementType === "employee").length;
  const contractors = members.length - employees;

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Team, Workforce & Compensation"
        subtitle="People, engagement models, capacity, and the operating-model decision — partner shop through standalone facility."
        actions={canWrite ? <AddTeamMemberButton /> : undefined}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Team Members" value={members.length} accent="vehicle" />
        <MetricCard label="Employees" value={employees} />
        <MetricCard label="Contractors / Shops" value={contractors} />
        {canFinance && <MetricCard label="Monthly Labor" value={formatCents(monthlyLaborCents)} accent="financial" />}
      </div>

      {/* Roster */}
      <Panel className="mt-6" title="Roster">
        {members.length === 0 ? (
          <p className="text-sm text-paper-muted">No team members yet.</p>
        ) : (
          <div className="scroll-steel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th><th>Role</th><th>Engagement</th>
                  <th className="num">Assigned hrs/wk</th><th className="num">Capacity hrs/wk</th>
                  {canFinance && <th className="num">Monthly Cost</th>}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className="text-paper-warm">
                      {m.name}
                      {m.relationship && <span className="ml-2 text-xs text-paper-muted">{m.relationship}</span>}
                    </td>
                    <td className="text-paper-steel">{m.role}</td>
                    <td><StatusBadge status={m.engagementType} /></td>
                    <td className="num">{m.assignedHoursPerWeek || "—"}</td>
                    <td className="num">{m.capacityHoursPerWeek ?? "—"}</td>
                    {canFinance && <td className="num text-paper-warm">{formatCents(m.monthlyCostCents)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!canFinance && (
          <p className="mt-3 text-xs text-paper-muted">Compensation amounts are confidential and hidden for your role.</p>
        )}
      </Panel>

      {/* Operating-model scenarios (confidential) */}
      {scenarios && (
        <Panel className="mt-6" title="Operating-Model Scenarios · Confidential" accent="financial">
          <p className="mb-3 text-sm text-paper-muted">
            At <span className="text-paper-warm">{scenarios.params.monthlyBuildHours} build hrs/mo</span>, comparing
            monthly cost, capacity, and effective cost-per-hour across the five operating models.
            Recommended: <span className="text-status-gain">{scenarios.recommended?.scenario ?? "—"}</span> (cheapest that covers demand capacity).
          </p>
          <div className="scroll-steel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th className="num">Monthly</th><th className="num">Annual</th>
                  <th className="num">Capacity hrs/mo</th><th className="num">Cost / hr</th>
                  <th>Cost basis</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.results.map((r) => {
                  const isRec = r.scenario === scenarios.recommended?.scenario;
                  return (
                    <tr key={r.scenario} className={isRec ? "bg-status-gain/5" : ""}>
                      <td className={isRec ? "font-semibold text-status-gain" : "text-paper-warm"}>
                        {r.scenario}{isRec ? " ✓" : ""}
                      </td>
                      <td className="num text-paper-warm">{formatCents(r.monthlyCostCents)}</td>
                      <td className="num text-paper-muted">{formatCents(r.annualCostCents)}</td>
                      <td className="num">{r.capacityHoursPerMonth}</td>
                      <td className="num">{formatCents(r.costPerHourCents)}</td>
                      <td className="text-xs text-paper-muted">{r.fixed ? "Fixed" : "Variable"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 grid gap-2 text-xs text-paper-muted sm:grid-cols-2 lg:grid-cols-3">
            {scenarios.results.map((r) => (
              <div key={r.scenario} className="rounded border border-bg-gunmetal p-2">
                <div className="font-semibold text-paper-steel">{r.scenario}</div>
                <div className="mt-0.5">{r.note}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-paper-muted">
            &quot;Stay Partner Shop&quot; uses live partner-shop rate and capacity. Other scenarios use documented
            planning assumptions (editable in settings in a later pass).
          </p>
        </Panel>
      )}
    </div>
  );
}
