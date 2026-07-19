// Maps domain status/severity strings to a consistent visual token set.
// Status is NEVER color-only (Section 4) — every mapping carries a tone that the
// badge components render with an accompanying dot + label.

export type StatusTone =
  | "healthy"
  | "attention"
  | "risk"
  | "critical"
  | "info"
  | "inactive";

const TONE_DOT: Record<StatusTone, string> = {
  healthy: "bg-status-healthy",
  attention: "bg-status-attention",
  risk: "bg-status-risk",
  critical: "bg-status-critical",
  info: "bg-status-info",
  inactive: "bg-status-inactive",
};

const TONE_TEXT: Record<StatusTone, string> = {
  healthy: "text-status-healthy",
  attention: "text-status-attention",
  risk: "text-status-risk",
  critical: "text-status-critical",
  info: "text-status-info",
  inactive: "text-paper-muted",
};

export function toneDotClass(tone: StatusTone) {
  return TONE_DOT[tone];
}
export function toneTextClass(tone: StatusTone) {
  return TONE_TEXT[tone];
}

// Vehicle + project + phase + task statuses → tone.
export function statusTone(status: string): StatusTone {
  const s = status.toLowerCase();
  if (/(complete|completed|sold|active build|published)/.test(s)) return "healthy";
  if (/(active|in progress|in review)/.test(s)) return "info";
  if (/(await|waiting|planned|not started|tentative|scheduled|under evaluation|potential)/.test(s)) return "inactive";
  if (/(on hold|blocked|behind schedule|attention|mitigating)/.test(s)) return "attention";
  if (/(over budget|risk|open)/.test(s)) return "risk";
  if (/(critical|cancel|cancelled|legal hold)/.test(s)) return "critical";
  return "inactive";
}

// Risk severity → tone.
export function severityTone(severity: string): StatusTone {
  switch (severity.toLowerCase()) {
    case "critical": return "critical";
    case "high": return "risk";
    case "medium": return "attention";
    case "low": return "info";
    default: return "inactive";
  }
}

// Calendar category → token classes (Section 13: work/cash/content/revenue).
export const CALENDAR_CATEGORIES = [
  { key: "work", label: "Work", dot: "bg-cal-work", text: "text-cal-work", border: "border-cal-work" },
  { key: "cash", label: "Cash", dot: "bg-cal-cash", text: "text-cal-cash", border: "border-cal-cash" },
  { key: "content", label: "Content", dot: "bg-cal-content", text: "text-cal-content", border: "border-cal-content" },
  { key: "revenue", label: "Revenue", dot: "bg-cal-revenue", text: "text-cal-revenue", border: "border-cal-revenue" },
] as const;
