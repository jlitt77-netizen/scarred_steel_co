import { PageHeader } from "@/components/ui/primitives";
import { Panel } from "@/components/ui/primitives";
import { IconCheck } from "@/components/ui/icons";
import { CALENDAR_CATEGORIES } from "@/lib/status-colors";

// Branded placeholder for command centers / portal experiences not yet built.
// Uses the permanent design system so nothing reads as generic scaffolding.
export function ModulePlaceholder({
  title,
  phase,
  summary,
  capabilities,
  eyebrow = "Planned Command Center",
  showCalendarLegend = false,
}: {
  title: string;
  phase: number;
  summary: string;
  capabilities: string[];
  eyebrow?: string;
  showCalendarLegend?: boolean;
}) {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={`${eyebrow} · Phase ${phase}`}
        title={title}
        subtitle={summary}
      />

      <Panel accent="neutral" title="Planned capabilities">
        <ul className="grid gap-2 sm:grid-cols-2">
          {capabilities.map((c) => (
            <li key={c} className="flex items-start gap-2 text-sm text-paper-steel">
              <IconCheck className="mt-0.5 shrink-0 text-status-healthy" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </Panel>

      {showCalendarLegend && (
        <Panel className="mt-4" title="Event categories">
          <div className="flex flex-wrap gap-4">
            {CALENDAR_CATEGORIES.map((c) => (
              <div key={c.key} className="flex items-center gap-2 text-sm text-paper-steel">
                <span className={`h-3 w-3 rounded-sm ${c.dot}`} />
                {c.label}
              </div>
            ))}
          </div>
        </Panel>
      )}

      <p className="mt-4 text-xs text-paper-muted">
        Scaffolded now with the Scarred Steel Design System. Its data model
        participates in the shared schema today; the interactive module ships in
        Phase {phase}.
      </p>
    </div>
  );
}
