import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PORTAL_NAV } from "@/lib/navigation";
import { Logo } from "@/components/ui/Logo";
import { IconChevron } from "@/components/ui/icons";

export default async function PortalHome() {
  const ctx = await requireAuth();
  const items = PORTAL_NAV.flatMap((s) => s.items).filter(
    (i) => i.permission === null || can(ctx, i.permission),
  );

  return (
    <div>
      {/* Cinematic hero band */}
      <section className="surface-texture relative mb-8 overflow-hidden rounded-lg border border-bg-gunmetal px-6 py-14 sm:px-10 sm:py-20">
        <div className="absolute inset-0 bg-gradient-to-t from-bg-nearblack via-transparent to-transparent" />
        <div className="relative">
          <Logo variant="full" className="text-3xl sm:text-4xl" />
          <h1 className="mt-4 max-w-2xl text-4xl uppercase leading-tight text-paper-warm sm:text-5xl">
            Built, not broken.
          </h1>
          <p className="mt-3 max-w-xl text-paper-steel">
            Welcome, {ctx.name}. Follow the builds, the stories, and the steel.
          </p>
        </div>
      </section>

      {items.length === 0 ? (
        <div className="panel p-6 text-paper-muted">
          Your account doesn&apos;t have any portal experiences enabled yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="panel group block p-5 transition hover:border-rust">
              <div className="font-display text-xl uppercase tracking-wide text-paper-warm group-hover:text-rust-400">
                {i.label}
              </div>
              <div className="mt-2 inline-flex items-center gap-1 text-sm text-paper-muted">
                Open <IconChevron />
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-8 text-xs text-paper-muted">
        The Portal never exposes internal financials, margins, reserves, payroll,
        confidential contracts, legal notes, or risk/scenario data.
      </p>
    </div>
  );
}
