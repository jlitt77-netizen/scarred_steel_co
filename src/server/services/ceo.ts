import { prisma } from "@/lib/prisma";
import { requirePermission, can, type AuthContext } from "@/lib/rbac";
import { buildBrief } from "@/server/ceo/brief";
import { riskExposure } from "@/server/risk/scoring";
import { getCashSummary, getForecast } from "@/server/services/finance";
import { getDeliverablesDueCount } from "@/server/services/sponsors";
import { getGiveawaySummary } from "@/server/services/giveaways";
import { getMerchSummary } from "@/server/services/commerce";

// CEO Command Center (Section 24). Confidential executive aggregation — gated on
// ceo:dashboard, then each sub-domain is included only if the viewer can read it.

export async function getCeoBrief(ctx: AuthContext) {
  requirePermission(ctx, "ceo:dashboard");

  const canFinance = can(ctx, "finance:read");
  const canRisk = can(ctx, "risk:read");
  const canSponsor = can(ctx, "sponsor:read");
  const canGiveaway = can(ctx, "giveaway:read");
  const canMedia = can(ctx, "media:read");
  const canCommerce = can(ctx, "commerce:read");

  const [projects, cash, forecast, risks, sponsorDue, giveaways, socialInReview, merch] = await Promise.all([
    prisma.project.findMany({ select: { budgetCents: true, actualCostCents: true, status: true } }),
    canFinance ? getCashSummary(ctx) : Promise.resolve(null),
    canFinance ? getForecast(ctx, 12) : Promise.resolve(null),
    canRisk ? prisma.risk.findMany() : Promise.resolve([]),
    canSponsor ? getDeliverablesDueCount(ctx) : Promise.resolve(null),
    canGiveaway ? getGiveawaySummary(ctx) : Promise.resolve(null),
    canMedia ? prisma.socialPost.count({ where: { status: "Sponsor Review" } }) : Promise.resolve(0),
    canCommerce ? getMerchSummary(ctx) : Promise.resolve(null),
  ]);

  const buildsOverBudget = projects.filter((p) => p.budgetCents != null && p.actualCostCents != null && p.actualCostCents > p.budgetCents).length;
  const exposure = riskExposure(risks);
  const cashTroughCents = forecast?.trough?.balanceCents ?? null;
  const runwayMonths = forecast ? forecast.buckets.findIndex((b) => b.endingBalanceCents < 0) : -1;

  const inputs = {
    availableOperatingCents: cash?.availableOperatingCents ?? 0,
    protectedReserveCents: cash?.protectedReserveCents ?? 0,
    net30Cents: cash?.net30Cents ?? 0,
    cashTroughCents,
    runwayMonths: runwayMonths >= 0 ? runwayMonths : null,
    buildsOverBudget,
    buildsAtRisk: risks.filter((r) => r.projectId && (r.status === "open" || r.status === "mitigating")).length,
    openRisks: exposure.openCount,
    criticalRisks: exposure.criticalCount,
    sponsorDeliverablesOverdue: sponsorDue?.overdue ?? 0,
    sponsorDeliverablesDueSoon: sponsorDue?.dueSoon ?? 0,
    giveawaysBlocked: giveaways?.blocked ?? 0,
    socialInReview,
    lowStockCount: merch?.lowStockCount ?? 0,
  };

  return {
    brief: buildBrief(inputs),
    inputs,
    cash,
    exposure: canRisk ? exposure : null,
    forecastPreview: forecast ? { openingCents: forecast.openingCents, trough: forecast.trough, buckets: forecast.buckets.slice(0, 6) } : null,
    scope: { canFinance, canRisk, canSponsor, canGiveaway, canMedia, canCommerce },
  };
}
