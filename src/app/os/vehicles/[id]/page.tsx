import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthWithPermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getVehicle } from "@/server/services/vehicles";
import {
  listCostItems, listPartsOrders, listDocuments, listPhotos, listIssues, getVehicleBuildBundle,
} from "@/server/services/build";
import { formatCents } from "@/lib/money";
import { Panel, StatusBadge, RiskBadge, ProgressBar, MetricCard, EmptyState } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IconTruck, IconCalendar } from "@/components/ui/icons";
import { AddCostButton, AddPartButton, AddDocumentButton, AddPhotoButton, AddIssueButton } from "./BuildForms";

const TABS = [
  ["overview", "Overview"], ["plan", "Build Plan"], ["costs", "Costs"], ["parts", "Parts"],
  ["documents", "Documents"], ["photos", "Photos"], ["issues", "Issues"], ["history", "History"],
] as const;

function money(c?: number | null) {
  return c == null ? "—" : formatCents(c);
}

export default async function VehicleDetail({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const tab = (TABS.some(([k]) => k === tabParam) ? tabParam : "overview") as string;

  const ctx = await requireAuthWithPermission("vehicle:read");
  const vehicle = await getVehicle(ctx, id);
  if (!vehicle) notFound();

  const project = await getVehicleBuildBundle(ctx, id);
  const projectId = project?.id;
  const phaseOpts = project?.phases.map((p) => ({ id: p.id, name: p.name })) ?? [];
  const showFinance = can(ctx, "finance:read");
  const canProject = can(ctx, "project:write");
  const canVehicle = can(ctx, "vehicle:write");
  const m = vehicle.metrics;

  return (
    <div>
      <Link href="/os/vehicles" className="text-sm text-paper-muted hover:text-rust-400">← Vehicles &amp; Builds</Link>

      {/* Header */}
      <div className="surface-texture mt-2 flex flex-col gap-4 rounded-md border border-bg-gunmetal p-5 sm:flex-row sm:items-center">
        <div className="flex h-28 w-full items-center justify-center rounded border border-bg-gunmetal bg-bg-nearblack sm:w-48">
          <IconTruck className="text-5xl text-bg-panel" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl uppercase leading-none text-paper-warm sm:text-4xl">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <StatusBadge status={vehicle.status} />
          </div>
          {vehicle.nickname && <div className="mt-1 text-sm text-paper-muted">&ldquo;{vehicle.nickname}&rdquo;</div>}
          <div className="mt-3 flex flex-wrap gap-6 text-sm">
            <div><div className="text-xs uppercase tracking-wide text-paper-muted">Invested</div><div className="tnum text-paper-warm">{formatCents(m.trueCashInvestedCents)}</div></div>
            <div><div className="text-xs uppercase tracking-wide text-paper-muted">Market Value</div><div className="tnum text-paper-warm">{money(vehicle.currentMarketValueCents)}</div></div>
            <div><div className="text-xs uppercase tracking-wide text-paper-muted">Target Sale</div><div className="tnum text-paper-warm">{money(vehicle.targetSalePriceCents)}</div></div>
            {project && <div><div className="text-xs uppercase tracking-wide text-paper-muted">Build</div><div className="tnum text-paper-warm">{project.percentComplete}%</div></div>}
          </div>
        </div>
        <Link href={`/os/calendar?vehicle=${id}`} className="btn-secondary self-start"><IconCalendar /> Calendar</Link>
      </div>

      {/* Tab bar */}
      <div className="scroll-steel mt-4 flex gap-1 overflow-x-auto border-b border-bg-gunmetal">
        {TABS.map(([key, label]) => {
          const active = key === tab;
          return (
            <Link key={key} href={`/os/vehicles/${id}?tab=${key}`}
              className={`shrink-0 border-b-2 px-3 py-2 text-sm ${active ? "border-rust text-paper-warm" : "border-transparent text-paper-muted hover:text-paper-steel"}`}>
              {label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        {!project && tab !== "overview" && tab !== "documents" && tab !== "photos" && (
          <EmptyState title="No build project yet" description="This vehicle has no build project, so there's nothing to track here yet." />
        )}

        {tab === "overview" && <Overview ctx={ctx} vehicle={vehicle} project={project} showFinance={showFinance} projectId={projectId} />}
        {tab === "plan" && project && <BuildPlan project={project} />}
        {tab === "costs" && projectId && <Costs ctx={ctx} projectId={projectId} vehicleId={id} phaseOpts={phaseOpts} canWrite={canProject} />}
        {tab === "parts" && projectId && <Parts ctx={ctx} projectId={projectId} vehicleId={id} phaseOpts={phaseOpts} canWrite={canProject} />}
        {tab === "documents" && <Documents ctx={ctx} vehicleId={id} projectId={projectId} canWrite={canVehicle} />}
        {tab === "photos" && <Photos ctx={ctx} vehicleId={id} projectId={projectId} canWrite={canVehicle} />}
        {tab === "issues" && projectId && <Issues ctx={ctx} projectId={projectId} vehicleId={id} canWrite={canProject} />}
        {tab === "history" && <History id={id} projectId={projectId} />}
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */

async function Overview({ ctx, vehicle, project, showFinance, projectId }: any) {
  const rollup = projectId ? (await listCostItems(ctx, projectId)).rollup : null;
  const rows: { label: string; value: string; confidential?: boolean }[] = [
    { label: "Acquisition Cost", value: money(vehicle.acquisitionCostCents) },
    { label: "Build Budget", value: money(vehicle.buildBudgetCents) },
    { label: "Actual Cost", value: money(vehicle.actualCostCents) },
    { label: "True Cash Invested", value: formatCents(vehicle.metrics.trueCashInvestedCents), confidential: true },
    { label: "Current Market Value", value: money(vehicle.currentMarketValueCents) },
    { label: "Vehicle Profit", value: vehicle.metrics.vehicleProfitCents == null ? "— (unsold)" : formatCents(vehicle.metrics.vehicleProfitCents), confidential: true },
    { label: "ROI", value: vehicle.metrics.roi == null ? "—" : `${(vehicle.metrics.roi * 100).toFixed(1)}%`, confidential: true },
  ];
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Panel accent="financial" title="Economics">
        <dl className="space-y-1.5">
          {rows.map((r) => {
            const hide = r.confidential && !showFinance;
            return (
              <div key={r.label} className="flex justify-between text-sm">
                <dt className="text-paper-muted">{r.label}</dt>
                <dd className={`tnum ${hide ? "text-paper-muted/50" : "text-paper-warm"}`}>{hide ? "restricted" : r.value}</dd>
              </div>
            );
          })}
        </dl>
      </Panel>
      <div className="space-y-6">
        {rollup && (
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Cost Budget" value={formatCents(rollup.totals.budgetCents)} accent="financial" />
            <MetricCard label="Actual Spend" value={formatCents(rollup.totals.actualCents)} />
            <MetricCard label="Committed" value={formatCents(rollup.totals.committedCents)} />
            <MetricCard label="Variance" value={formatCents(rollup.totals.varianceCents)} tone={rollup.totals.varianceCents >= 0 ? "healthy" : "risk"} />
          </div>
        )}
        <Panel accent="vehicle" title="Build Progress">
          {project ? (
            <>
              <div className="mb-1 flex justify-between text-sm"><span className="text-paper-steel">{project.name}</span><span className="tnum text-paper-muted">{project.percentComplete}%</span></div>
              <ProgressBar value={project.percentComplete} />
              <div className="mt-3 text-xs text-paper-muted">{project.phases.length} phases · {project.phases.reduce((s: number, p: any) => s + p.tasks.length, 0)} tasks</div>
            </>
          ) : <p className="text-sm text-paper-muted">No build project linked.</p>}
        </Panel>
      </div>
    </div>
  );
}

function BuildPlan({ project }: any) {
  return (
    <div className="space-y-3">
      {project.phases.map((ph: any) => (
        <Panel key={ph.id}>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-display text-lg uppercase text-paper-warm">{ph.name}</span>
              <StatusBadge status={ph.status} />
            </div>
            <span className="tnum text-sm text-paper-muted">{ph.percentComplete}%</span>
          </div>
          <ProgressBar value={ph.percentComplete} />
          {ph.tasks.length > 0 && (
            <ul className="mt-3 space-y-1">
              {ph.tasks.map((t: any) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-paper-steel">{t.title}</span>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ))}
      {project.phases.length === 0 && <EmptyState title="No phases yet" description="Add build phases to plan this build." />}
    </div>
  );
}

async function Costs({ ctx, projectId, vehicleId, phaseOpts, canWrite }: any) {
  const { items, rollup } = await listCostItems(ctx, projectId);
  const columns: Column<any>[] = [
    { key: "cat", header: "Category", render: (c) => c.category },
    { key: "desc", header: "Description", render: (c) => <span className="text-paper-muted">{c.description}</span> },
    { key: "status", header: "Status", render: (c) => <StatusBadge status={c.status} /> },
    { key: "budget", header: "Budget", align: "right", render: (c) => money(c.budgetCents) },
    { key: "committed", header: "Committed", align: "right", render: (c) => money(c.committedCents) },
    { key: "actual", header: "Actual", align: "right", render: (c) => money(c.actualCents) },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="Budget" value={formatCents(rollup.totals.budgetCents)} accent="financial" />
          <MetricCard label="Committed" value={formatCents(rollup.totals.committedCents)} />
          <MetricCard label="Actual" value={formatCents(rollup.totals.actualCents)} />
          <MetricCard label="Variance" value={formatCents(rollup.totals.varianceCents)} tone={rollup.totals.varianceCents >= 0 ? "healthy" : "risk"} />
        </div>
      </div>
      {canWrite && <div><AddCostButton projectId={projectId} vehicleId={vehicleId} phases={phaseOpts} /></div>}

      <Panel title="By category">
        <div className="scroll-steel overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Category</th><th className="num">Budget</th><th className="num">Committed</th><th className="num">Actual</th><th className="num">Variance</th></tr></thead>
            <tbody>
              {rollup.categories.map((c: any) => (
                <tr key={c.category}>
                  <td>{c.category} <span className="text-paper-muted">×{c.itemCount}</span></td>
                  <td className="num">{formatCents(c.budgetCents)}</td>
                  <td className="num">{formatCents(c.committedCents)}</td>
                  <td className="num">{formatCents(c.actualCents)}</td>
                  <td className={`num ${c.varianceCents >= 0 ? "text-status-gain" : "text-status-loss"}`}>{formatCents(c.varianceCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <DataTable columns={columns} rows={items} getKey={(c: any) => c.id} empty="No cost items yet." />
    </div>
  );
}

async function Parts({ ctx, projectId, vehicleId, phaseOpts, canWrite }: any) {
  const parts = await listPartsOrders(ctx, projectId);
  const columns: Column<any>[] = [
    { key: "part", header: "Part", render: (p) => <span>{p.partName}{p.partNumber ? <span className="text-paper-muted"> · {p.partNumber}</span> : ""}</span> },
    { key: "mfr", header: "Manufacturer", render: (p) => <span className="text-paper-muted">{p.manufacturer ?? "—"}</span> },
    { key: "qty", header: "Qty", align: "right", render: (p) => p.quantity },
    { key: "unit", header: "Unit", align: "right", render: (p) => money(p.unitCostCents) },
    { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
    { key: "vendor", header: "Vendor", render: (p) => <span className="text-paper-muted">{p.vendor ?? "—"}</span> },
  ];
  return (
    <div className="space-y-4">
      {canWrite && <AddPartButton projectId={projectId} vehicleId={vehicleId} phases={phaseOpts} />}
      <DataTable columns={columns} rows={parts} getKey={(p: any) => p.id} empty="No parts orders yet." />
    </div>
  );
}

async function Documents({ ctx, vehicleId, projectId, canWrite }: any) {
  const docs = await listDocuments(ctx, { vehicleId, projectId });
  return (
    <div className="space-y-4">
      {canWrite && <AddDocumentButton vehicleId={vehicleId} projectId={projectId ?? ""} />}
      {docs.length === 0 ? (
        <EmptyState title="No documents" description="Titles, invoices, inspections, and contracts live here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d: any) => (
            <div key={d.id} className="panel p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-paper-warm">{d.name}</span>
                <span className="badge">{d.category}</span>
              </div>
              {d.notes && <p className="mt-1 text-xs text-paper-muted">{d.notes}</p>}
              {d.url && <a href={d.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-rust-400 hover:underline">Open ↗</a>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function Photos({ ctx, vehicleId, projectId, canWrite }: any) {
  const photos = await listPhotos(ctx, { vehicleId, projectId });
  return (
    <div className="space-y-4">
      {canWrite && <AddPhotoButton vehicleId={vehicleId} projectId={projectId ?? ""} />}
      {photos.length === 0 ? (
        <EmptyState title="No photos" description="Add build photos by URL (direct upload coming in a later pass)." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {photos.map((p: any) => (
            <figure key={p.id} className="panel overflow-hidden p-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption ?? ""} className="h-40 w-full object-cover" />
              {p.caption && <figcaption className="px-3 py-2 text-xs text-paper-muted">{p.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

async function Issues({ ctx, projectId, vehicleId, canWrite }: any) {
  const issues = await listIssues(ctx, projectId);
  return (
    <div className="space-y-4">
      {canWrite && <AddIssueButton projectId={projectId} vehicleId={vehicleId} />}
      {issues.length === 0 ? (
        <EmptyState title="No open issues" description="Log build problems, blockers, and surprises here." />
      ) : (
        <div className="space-y-2">
          {issues.map((i: any) => (
            <Panel key={i.id} accent={i.status === "resolved" ? "neutral" : "risk"}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-paper-warm">{i.title}</div>
                  {i.description && <div className="mt-0.5 text-sm text-paper-muted">{i.description}</div>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <RiskBadge severity={i.severity} />
                  <StatusBadge status={i.status} />
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

async function History({ id, projectId }: any) {
  const [changeLogs, audits] = await Promise.all([
    projectId ? prisma.changeLog.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 20 }) : Promise.resolve([]),
    prisma.auditLog.findMany({
      where: { OR: [{ entityId: id }, ...(projectId ? [{ entityId: projectId }] : [])] },
      orderBy: { createdAt: "desc" }, take: 30,
    }),
  ]);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Change Log">
        {changeLogs.length === 0 ? <p className="text-sm text-paper-muted">No schedule/budget changes recorded.</p> : (
          <ul className="space-y-2">
            {changeLogs.map((l) => (
              <li key={l.id} className="border-b border-bg-gunmetal pb-2 text-sm last:border-0">
                <div className="text-paper-steel">{l.summary}</div>
                <div className="text-[11px] text-paper-muted tnum">{l.createdAt.toISOString().slice(0, 16).replace("T", " ")}</div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Audit Trail">
        {audits.length === 0 ? <p className="text-sm text-paper-muted">No audit entries.</p> : (
          <ul className="space-y-1.5">
            {audits.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <span className="text-paper-steel">{a.entityType} <span className="badge ml-1">{a.action}</span></span>
                <span className="text-[11px] text-paper-muted tnum">{a.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
