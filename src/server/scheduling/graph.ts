// Pure scheduling graph + cascade logic (no DB, no I/O) so it is exhaustively
// unit-testable. The Prisma service layer (services/reschedule.ts) fetches data,
// calls these functions, and persists the result.

export interface TaskNode {
  id: string;
  title: string;
  projectId: string;
  ownerId: string | null;
  plannedStart: Date | null;
  plannedEnd: Date | null;
}

export interface DependencyEdge {
  predecessorId: string;
  successorId: string;
  type: string; // finish_to_start (others treated as FS in Phase 2)
  lagDays: number;
}

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
}

/** Adjacency map predecessor -> successors. */
export function buildAdjacency(edges: DependencyEdge[]): Map<string, DependencyEdge[]> {
  const adj = new Map<string, DependencyEdge[]>();
  for (const e of edges) {
    const list = adj.get(e.predecessorId) ?? [];
    list.push(e);
    adj.set(e.predecessorId, list);
  }
  return adj;
}

/**
 * All tasks strictly downstream of `startId` (successors, transitively).
 * Cycle-safe via a visited set — Phase 1 already prevents dependency cycles at
 * write time, but this guarantees termination regardless.
 */
export function downstreamTaskIds(
  startId: string,
  edges: DependencyEdge[],
): string[] {
  const adj = buildAdjacency(edges);
  const seen = new Set<string>();
  const out: string[] = [];
  const stack = [...(adj.get(startId) ?? []).map((e) => e.successorId)];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    for (const e of adj.get(id) ?? []) stack.push(e.successorId);
  }
  return out;
}

export interface TaskShift {
  taskId: string;
  title: string;
  ownerId: string | null;
  oldStart: Date | null;
  oldEnd: Date | null;
  newStart: Date | null;
  newEnd: Date | null;
}

/**
 * Cascade a move of `rootId` by `deltaDays`. Phase 2 uses a push-downstream
 * model: the root and every downstream task shift by the same delta (respecting
 * that dependent work cannot start before its predecessor). Returns the shift
 * for the root plus each affected downstream task. Slack-aware CPM is a later
 * refinement (documented).
 */
export function computeCascade(
  tasks: TaskNode[],
  edges: DependencyEdge[],
  rootId: string,
  deltaDays: number,
): TaskShift[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const root = byId.get(rootId);
  if (!root) throw new Error(`Task ${rootId} not found`);

  const affectedIds = [rootId, ...downstreamTaskIds(rootId, edges)];
  const shift = (t: TaskNode): TaskShift => ({
    taskId: t.id,
    title: t.title,
    ownerId: t.ownerId,
    oldStart: t.plannedStart,
    oldEnd: t.plannedEnd,
    newStart: t.plannedStart ? addDays(t.plannedStart, deltaDays) : null,
    newEnd: t.plannedEnd ? addDays(t.plannedEnd, deltaDays) : null,
  });

  return affectedIds
    .map((id) => byId.get(id))
    .filter((t): t is TaskNode => !!t)
    .map(shift);
}

/**
 * Detect owner double-bookings on the *new* schedule: two tasks with the same
 * owner whose [start,end] intervals overlap. Only reports pairs where at least
 * one task was shifted (i.e. the reschedule introduced/kept the conflict).
 */
export interface ResourceConflict {
  ownerId: string;
  aTaskId: string;
  aTitle: string;
  bTaskId: string;
  bTitle: string;
}

export function detectOwnerConflicts(
  allTasks: TaskNode[],
  shifts: TaskShift[],
): ResourceConflict[] {
  const shiftById = new Map(shifts.map((s) => [s.taskId, s]));
  // Effective schedule after applying shifts.
  const effective = allTasks
    .map((t) => {
      const s = shiftById.get(t.id);
      const start = s ? s.newStart : t.plannedStart;
      const end = s ? s.newEnd : t.plannedEnd;
      return { id: t.id, title: t.title, ownerId: t.ownerId, start, end, shifted: !!s };
    })
    .filter((t) => t.ownerId && t.start && t.end);

  const conflicts: ResourceConflict[] = [];
  for (let i = 0; i < effective.length; i++) {
    for (let j = i + 1; j < effective.length; j++) {
      const a = effective[i];
      const b = effective[j];
      if (a.ownerId !== b.ownerId) continue;
      if (!a.shifted && !b.shifted) continue; // pre-existing, unrelated
      const overlap = a.start! <= b.end! && b.start! <= a.end!;
      if (overlap) {
        conflicts.push({
          ownerId: a.ownerId!,
          aTaskId: a.id, aTitle: a.title,
          bTaskId: b.id, bTitle: b.title,
        });
      }
    }
  }
  return conflicts;
}
