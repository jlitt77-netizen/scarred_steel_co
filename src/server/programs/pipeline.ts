// Pure pipeline helpers for the Finds and Rescues programs (Sections 21–22).
// No DB. Generic stage-funnel used by both.

export interface FunnelBucket {
  stage: string;
  count: number;
}

/** Count items per stage in the given canonical order (zeros included). */
export function countByStage(items: { stage: string }[], stages: readonly string[]): FunnelBucket[] {
  const counts = new Map<string, number>(stages.map((s) => [s, 0]));
  for (const it of items) counts.set(it.stage, (counts.get(it.stage) ?? 0) + 1);
  return stages.map((stage) => ({ stage, count: counts.get(stage) ?? 0 }));
}

/** Count items per outcome (only non-null outcomes), preserving canonical order. */
export function countByOutcome(items: { outcome?: string | null }[], outcomes: readonly string[]): FunnelBucket[] {
  const counts = new Map<string, number>(outcomes.map((o) => [o, 0]));
  for (const it of items) if (it.outcome) counts.set(it.outcome, (counts.get(it.outcome) ?? 0) + 1);
  return outcomes.map((stage) => ({ stage, count: counts.get(stage) ?? 0 }));
}
