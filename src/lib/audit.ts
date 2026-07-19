import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

type Db = Prisma.TransactionClient | typeof prisma;

export interface AuditInput {
  entityType: string;
  entityId: string;
  action: string;
  field?: string;
  before?: unknown;
  after?: unknown;
  userId?: string | null;
}

/** Authoritative technical audit trail. "Nothing important moves silently." */
export async function writeAudit(input: AuditInput, db: Db = prisma) {
  return db.auditLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      field: input.field,
      beforeJson: input.before === undefined ? null : JSON.stringify(input.before),
      afterJson: input.after === undefined ? null : JSON.stringify(input.after),
      userId: input.userId ?? null,
    },
  });
}

export interface ChangeLogInput {
  projectId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  detail?: unknown;
  userId?: string | null;
}

/** Domain-level narrative change record (schedule/budget/cascade history). */
export async function writeChangeLog(input: ChangeLogInput, db: Db = prisma) {
  return db.changeLog.create({
    data: {
      projectId: input.projectId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      summary: input.summary,
      detailJson: input.detail === undefined ? null : JSON.stringify(input.detail),
      userId: input.userId ?? null,
    },
  });
}

/** Compute a shallow field-level diff between two records for audit payloads. */
export function diffRecords(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, { before: unknown; after: unknown }> {
  const changes: Record<string, { before: unknown; after: unknown }> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    const b = before[key];
    const a = after[key];
    const bn = b instanceof Date ? b.getTime() : b;
    const an = a instanceof Date ? a.getTime() : a;
    if (bn !== an) changes[key] = { before: b, after: a };
  }
  return changes;
}
