export function ModulePlaceholder({
  title,
  phase,
  summary,
  capabilities,
}: {
  title: string;
  phase: number;
  summary: string;
  capabilities: string[];
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-2 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-steel-100">{title}</h1>
        <span className="badge">Planned · Phase {phase}</span>
      </div>
      <p className="mb-6 text-steel-400">{summary}</p>
      <div className="card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-steel-400">
          Planned capabilities
        </h2>
        <ul className="space-y-2">
          {capabilities.map((c) => (
            <li key={c} className="flex items-start gap-2 text-sm text-steel-300">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rust-500" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-4 text-xs text-steel-600">
        This command center is scaffolded in Phase 1. Its data model participates
        in the shared schema now; the interactive module ships in Phase {phase}.
      </p>
    </div>
  );
}
