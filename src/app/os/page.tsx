import Link from "next/link";
import { requireInternal } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { CEO_OS_COMMAND_CENTER_COUNT } from "@/lib/navigation";

export default async function OsHome() {
  const ctx = await requireInternal();

  const [vehicles, projects, tasks, openRisks] = await Promise.all([
    prisma.vehicle.count(),
    prisma.project.count(),
    prisma.task.count(),
    can(ctx, "risk:read")
      ? prisma.risk.count({ where: { status: { in: ["open", "mitigating"] } } })
      : Promise.resolve(null),
  ]);

  const stats: { label: string; value: string | number; href?: string }[] = [
    { label: "Vehicles", value: vehicles, href: "/os/vehicles" },
    { label: "Build Projects", value: projects, href: "/os/vehicles" },
    { label: "Tasks", value: tasks },
    ...(openRisks !== null
      ? [{ label: "Open Risks", value: openRisks, href: "/os/risk" }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-steel-100">CEO OS</h1>
        <span className="badge">Phase 1 · Foundation</span>
      </div>
      <p className="mb-8 text-steel-400">
        Welcome, {ctx.name}. All {CEO_OS_COMMAND_CENTER_COUNT} command centers are
        represented in navigation; the Vehicle Portfolio is live in Phase 1.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => {
          const body = (
            <div className="card">
              <div className="text-3xl font-bold text-steel-100">{s.value}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-steel-500">
                {s.label}
              </div>
            </div>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="block hover:opacity-90">
              {body}
            </Link>
          ) : (
            <div key={s.label}>{body}</div>
          );
        })}
      </div>

      <div className="mt-8 card">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-steel-400">
          Phase 1 status
        </h2>
        <p className="text-sm text-steel-300">
          Application shell, authentication, strict RBAC, the shared relational
          data model, and audit logging are in place. Scheduling (Phase 2),
          Finance (Phase 4), and the remaining command centers build on this
          foundation. Confidential data (finance, risk, forecast) is gated to
          internal roles and never exposed to the external Portal.
        </p>
      </div>
    </div>
  );
}
