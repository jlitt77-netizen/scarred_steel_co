import type { ReactNode } from "react";
import {
  statusTone,
  severityTone,
  toneDotClass,
  toneTextClass,
  type StatusTone,
} from "@/lib/status-colors";
import { formatCents } from "@/lib/money";

// ---- PageHeader --------------------------------------------------------------
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  textured = true,
}: {
  title: string;
  subtitle?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  textured?: boolean;
}) {
  return (
    <header
      className={`mb-6 flex flex-col gap-3 border-b border-bg-gunmetal pb-5 sm:flex-row sm:items-end sm:justify-between ${
        textured ? "surface-texture -mx-8 -mt-8 px-8 pb-5 pt-8" : ""
      }`}
    >
      <div>
        {eyebrow && (
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-rust-400">
            {eyebrow}
          </div>
        )}
        <h1 className="text-3xl uppercase leading-none text-paper-warm sm:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-sm text-paper-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

// ---- Panel -------------------------------------------------------------------
const ACCENT: Record<string, string> = {
  financial: "border-l-status-gain",
  vehicle: "border-l-patina",
  media: "border-l-cal-content",
  sponsor: "border-l-amber",
  risk: "border-l-status-risk",
  neutral: "border-l-bg-panel",
};

export function Panel({
  children,
  className = "",
  accent,
  title,
}: {
  children: ReactNode;
  className?: string;
  accent?: keyof typeof ACCENT;
  title?: string;
}) {
  return (
    <section
      className={`panel p-5 ${accent ? `accent-bar ${ACCENT[accent]}` : ""} ${className}`}
    >
      {title && (
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-paper-muted">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

// ---- MetricCard --------------------------------------------------------------
export function MetricCard({
  label,
  value,
  hint,
  tone,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: StatusTone;
  accent?: keyof typeof ACCENT;
}) {
  return (
    <div className={`panel p-4 ${accent ? `accent-bar ${ACCENT[accent]}` : ""}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-paper-muted">
        {label}
      </div>
      <div
        className={`metric-value mt-1 font-display text-3xl leading-none ${
          tone ? toneTextClass(tone) : "text-paper-warm"
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-paper-muted">{hint}</div>}
    </div>
  );
}

// ---- FinancialMetric (signed money, muted green/red) -------------------------
export function FinancialMetric({
  label,
  cents,
  hint,
  signed = false,
}: {
  label: string;
  cents: number | null | undefined;
  hint?: ReactNode;
  signed?: boolean;
}) {
  const positive = (cents ?? 0) >= 0;
  const toneClass = !signed
    ? "text-paper-warm"
    : positive
      ? "text-status-gain"
      : "text-status-loss";
  const prefix = signed && positive && (cents ?? 0) > 0 ? "+" : "";
  return (
    <div className="panel p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-paper-muted">
        {label}
      </div>
      <div className={`metric-value mt-1 font-display text-3xl leading-none tnum ${toneClass}`}>
        {prefix}
        {formatCents(cents)}
      </div>
      {hint && <div className="mt-1 text-xs text-paper-muted">{hint}</div>}
    </div>
  );
}

// ---- Badges ------------------------------------------------------------------
export function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <span className="badge">
      <span className={`h-1.5 w-1.5 rounded-full ${toneDotClass(tone)}`} />
      {status}
    </span>
  );
}

export function RiskBadge({
  severity,
  label,
}: {
  severity: string;
  label?: string;
}) {
  const tone = severityTone(severity);
  return (
    <span className={`badge ${toneTextClass(tone)}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${toneDotClass(tone)}`} />
      {label ?? severity}
    </span>
  );
}

// ---- ProgressBar -------------------------------------------------------------
export function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-bg-gunmetal ${className}`}>
      <div
        className="h-full rounded-full bg-rust-400 transition-[width] duration-500"
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

// ---- CapacityMeter -----------------------------------------------------------
export function CapacityMeter({
  label,
  percent,
}: {
  label: string;
  percent: number;
}) {
  const pct = Math.max(0, Math.min(100, percent));
  const tone =
    pct >= 95 ? "bg-status-critical" : pct >= 80 ? "bg-status-attention" : "bg-status-healthy";
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-paper-steel">{label}</span>
        <span className="tnum text-paper-muted">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-bg-gunmetal">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ---- EmptyState --------------------------------------------------------------
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="surface-texture flex flex-col items-center justify-center rounded-md border border-bg-gunmetal px-6 py-14 text-center">
      {icon && <div className="mb-3 text-4xl text-bg-panel">{icon}</div>}
      <h3 className="font-display text-xl uppercase tracking-wide text-paper-steel">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-paper-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
