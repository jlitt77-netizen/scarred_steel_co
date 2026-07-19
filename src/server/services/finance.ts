import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { RESERVE_ACCOUNT_TYPES } from "@/lib/enums";
import { buildForecast, periodTotals, lowestBalance, type CashFlow } from "@/server/finance/cashflow";
import { segmentPnl } from "@/server/finance/pnl";
import { rollupCosts } from "@/server/build/cost-rollup";
import type { Account, Receivable, Payable } from "@prisma/client";

// All finance surfaces are confidential (Section 32) — gated on finance:read.

export async function getCashPosition(ctx: AuthContext) {
  requirePermission(ctx, "finance:read");
  const accounts = await prisma.account.findMany({ orderBy: { sortOrder: "asc" } });
  const reserves = new Set<string>(RESERVE_ACCOUNT_TYPES);
  const totalCents = accounts.reduce((s, a) => s + a.balanceCents, 0);
  const reserveCents = accounts.filter((a) => reserves.has(a.type)).reduce((s, a) => s + a.balanceCents, 0);
  const availableOperatingCents = totalCents - reserveCents;
  const protectedReserveCents = accounts
    .filter((a) => a.type === "Protected Household Reserve")
    .reduce((s, a) => s + a.balanceCents, 0);
  return { accounts, totalCents, reserveCents, availableOperatingCents, protectedReserveCents };
}

/** Gather all forecastable inflows/outflows from AR, AP, and four-date events. */
async function gatherFlows() {
  const [receivables, payables, events] = await Promise.all([
    prisma.receivable.findMany({ where: { status: "open" } }),
    prisma.payable.findMany({ where: { status: { not: "paid" } } }),
    prisma.event.findMany({
      where: { OR: [{ revenueDate: { not: null } }, { AND: [{ type: "cash_outflow" }, { cashDate: { not: null } }] }] },
    }),
  ]);

  const now = new Date();
  const inflows: CashFlow[] = [];
  const outflows: CashFlow[] = [];

  for (const r of receivables) inflows.push({ date: r.dueDate ?? now, amountCents: r.amountCents });
  for (const p of payables) outflows.push({ date: p.scheduledCashDate ?? p.dueDate ?? now, amountCents: p.amountCents });
  for (const e of events) {
    if (e.revenueDate && e.amountCents) inflows.push({ date: e.revenueDate, amountCents: e.amountCents });
    if (e.type === "cash_outflow" && e.cashDate && e.amountCents) outflows.push({ date: e.cashDate, amountCents: e.amountCents });
  }
  return { inflows, outflows, now };
}

export async function getForecast(ctx: AuthContext, months = 12) {
  requirePermission(ctx, "finance:read");
  const { totalCents } = await getCashPosition(ctx);
  const { inflows, outflows, now } = await gatherFlows();
  const buckets = buildForecast(totalCents, inflows, outflows, months, now);
  return { openingCents: totalCents, buckets, trough: lowestBalance(buckets) };
}

/** Compact cash summary for the CEO Command Center. */
export async function getCashSummary(ctx: AuthContext) {
  requirePermission(ctx, "finance:read");
  const pos = await getCashPosition(ctx);
  const { inflows, outflows, now } = await gatherFlows();
  const d30 = periodTotals(inflows, outflows, now, 30);
  return {
    availableOperatingCents: pos.availableOperatingCents,
    protectedReserveCents: pos.protectedReserveCents,
    totalCents: pos.totalCents,
    committedOutflow30Cents: d30.outflowCents,
    expectedInflow30Cents: d30.inflowCents,
    net30Cents: d30.netCents,
  };
}

function withAging<T extends { dueDate: Date | null; status: string }>(rows: T[], openStatuses: string[]) {
  const now = new Date();
  return rows.map((r) => ({
    ...r,
    overdue: openStatuses.includes(r.status) && r.dueDate != null && r.dueDate < now,
  }));
}

export async function listReceivables(ctx: AuthContext) {
  requirePermission(ctx, "finance:read");
  const rows = await prisma.receivable.findMany({ orderBy: [{ status: "asc" }, { dueDate: "asc" }] });
  const withFlag = withAging(rows, ["open"]);
  const openCents = rows.filter((r) => r.status === "open").reduce((s, r) => s + r.amountCents, 0);
  const overdueCents = withFlag.filter((r) => r.overdue).reduce((s, r) => s + r.amountCents, 0);
  return { rows: withFlag, openCents, overdueCents };
}

export async function listPayables(ctx: AuthContext) {
  requirePermission(ctx, "finance:read");
  const rows = await prisma.payable.findMany({ orderBy: [{ status: "asc" }, { dueDate: "asc" }] });
  const withFlag = withAging(rows, ["open", "scheduled"]);
  const openCents = rows.filter((r) => r.status !== "paid").reduce((s, r) => s + r.amountCents, 0);
  const overdueCents = withFlag.filter((r) => r.overdue).reduce((s, r) => s + r.amountCents, 0);
  return { rows: withFlag, openCents, overdueCents };
}

export async function getPnl(ctx: AuthContext) {
  requirePermission(ctx, "finance:read");
  const txns = await prisma.transaction.findMany();
  return segmentPnl(txns);
}

/** Budget vs actual across every project's cost items (Section 9). */
export async function getBudgetVsActual(ctx: AuthContext) {
  requirePermission(ctx, "finance:read");
  const items = await prisma.costItem.findMany();
  return rollupCosts(items);
}

// ---- writes -----------------------------------------------------------------
export async function createReceivable(ctx: AuthContext, data: Omit<Receivable, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById" | "receivedDate">) {
  requirePermission(ctx, "finance:write");
  const row = await prisma.receivable.create({ data: { ...data, createdById: ctx.userId, updatedById: ctx.userId } });
  await writeAudit({ entityType: "Receivable", entityId: row.id, action: "create", after: row, userId: ctx.userId });
  return row;
}

export async function createPayable(ctx: AuthContext, data: Omit<Payable, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById" | "paidDate">) {
  requirePermission(ctx, "finance:write");
  const row = await prisma.payable.create({ data: { ...data, createdById: ctx.userId, updatedById: ctx.userId } });
  await writeAudit({ entityType: "Payable", entityId: row.id, action: "create", after: row, userId: ctx.userId });
  return row;
}

export async function createAccount(ctx: AuthContext, data: Omit<Account, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">) {
  requirePermission(ctx, "finance:write");
  const row = await prisma.account.create({ data: { ...data, createdById: ctx.userId, updatedById: ctx.userId } });
  await writeAudit({ entityType: "Account", entityId: row.id, action: "create", after: row, userId: ctx.userId });
  return row;
}
