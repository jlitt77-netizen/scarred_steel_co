import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import {
  dependencyCreateSchema,
  type DependencyCreateInput,
} from "@/lib/validation";

/**
 * Would adding predecessor -> successor create a cycle? A cycle exists iff the
 * predecessor is already reachable from the successor via existing edges.
 * Cycle prevention is a hard correctness requirement — the Phase 2 cascade
 * engine walks this graph and must terminate.
 */
export async function wouldCreateCycle(
  predecessorId: string,
  successorId: string,
): Promise<boolean> {
  if (predecessorId === successorId) return true;
  const edges = await prisma.dependency.findMany({
    select: { predecessorId: true, successorId: true },
  });
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    const list = adj.get(e.predecessorId) ?? [];
    list.push(e.successorId);
    adj.set(e.predecessorId, list);
  }
  // DFS from successor; if we reach predecessor, the new edge closes a loop.
  const seen = new Set<string>();
  const stack = [successorId];
  while (stack.length) {
    const node = stack.pop()!;
    if (node === predecessorId) return true;
    if (seen.has(node)) continue;
    seen.add(node);
    for (const next of adj.get(node) ?? []) stack.push(next);
  }
  return false;
}

export async function listDependencies(ctx: AuthContext, projectId?: string) {
  requirePermission(ctx, "dependency:read");
  return prisma.dependency.findMany({
    where: projectId
      ? { predecessor: { projectId } }
      : undefined,
    include: { predecessor: true, successor: true },
  });
}

export async function createDependency(
  ctx: AuthContext,
  input: DependencyCreateInput,
) {
  requirePermission(ctx, "dependency:write");
  const data = dependencyCreateSchema.parse(input);

  const [pred, succ] = await Promise.all([
    prisma.task.findUnique({ where: { id: data.predecessorId } }),
    prisma.task.findUnique({ where: { id: data.successorId } }),
  ]);
  if (!pred || !succ) throw new Error("Both predecessor and successor tasks must exist.");

  if (await wouldCreateCycle(data.predecessorId, data.successorId)) {
    throw new Error("Dependency rejected: it would create a circular schedule.");
  }

  const dep = await prisma.dependency.create({
    data: { ...data, createdById: ctx.userId },
  });
  await writeAudit({
    entityType: "Dependency",
    entityId: dep.id,
    action: "create",
    after: dep,
    userId: ctx.userId,
  });
  return dep;
}
