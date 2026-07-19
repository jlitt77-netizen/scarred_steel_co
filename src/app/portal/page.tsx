import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PORTAL_NAV } from "@/lib/navigation";

export default async function PortalHome() {
  const ctx = await requireAuth();
  const items = PORTAL_NAV.flatMap((s) => s.items).filter(
    (i) => i.permission === null || can(ctx, i.permission),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold text-steel-100">
        Scarred <span className="text-rust-500">Steel</span> Co. Portal
      </h1>
      <p className="mb-8 text-steel-400">Welcome, {ctx.name}.</p>

      {items.length === 0 ? (
        <div className="card text-steel-400">
          Your account doesn&apos;t have any portal experiences enabled yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="card block hover:border-rust-500">
              <div className="text-lg font-semibold text-steel-100">{i.label}</div>
              <div className="mt-1 text-sm text-steel-500">Open →</div>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-8 text-xs text-steel-600">
        The Portal never exposes internal financials, margins, reserves, payroll,
        confidential contracts, legal notes, or risk/scenario data.
      </p>
    </div>
  );
}
