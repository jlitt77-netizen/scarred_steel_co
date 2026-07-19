import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import {
  episodeRevenueCents, episodeNetCents, contentRoiPct, revenueBySource,
  pipelineFunnel, socialFunnel, defaultPostSet,
} from "@/server/media/pipeline";
import type { ContentSeries, Episode, SocialPost, ContentRevenue } from "@prisma/client";

// Media & Content + Social command centers (Sections 14–16). Everything here is
// operational content data, gated on media:read / media:write.

// ---- reads ------------------------------------------------------------------

export async function listSeries(ctx: AuthContext) {
  requirePermission(ctx, "media:read");
  const series = await prisma.contentSeries.findMany({
    include: { episodes: { include: { revenues: true } } },
    orderBy: { createdAt: "asc" },
  });
  return series.map((s) => {
    const revenueCents = s.episodes.reduce((sum, e) => sum + episodeRevenueCents(e.revenues), 0);
    const productionCostCents = s.episodes.reduce((sum, e) => sum + (e.productionCostCents ?? 0), 0);
    const published = s.episodes.filter((e) => e.stage === "Published").length;
    return {
      ...s,
      episodeCount: s.episodes.length,
      publishedCount: published,
      revenueCents,
      productionCostCents,
      netCents: revenueCents - productionCostCents,
    };
  });
}

export async function listEpisodes(ctx: AuthContext) {
  requirePermission(ctx, "media:read");
  const episodes = await prisma.episode.findMany({
    include: { revenues: true, series: { select: { name: true } }, _count: { select: { posts: true } } },
    orderBy: [{ createdAt: "asc" }],
  });
  return episodes.map((e) => {
    const revenueCents = episodeRevenueCents(e.revenues);
    const costCents = e.productionCostCents ?? 0;
    return {
      ...e,
      seriesName: e.series?.name ?? null,
      postCount: e._count.posts,
      revenueCents,
      revenueBySource: revenueBySource(e.revenues),
      netCents: episodeNetCents(e),
      roiPct: contentRoiPct(costCents, revenueCents),
    };
  });
}

export async function getMediaSummary(ctx: AuthContext) {
  requirePermission(ctx, "media:read");
  const [episodes, revenues] = await Promise.all([
    prisma.episode.findMany({ select: { stage: true, productionCostCents: true } }),
    prisma.contentRevenue.findMany({ select: { amountCents: true } }),
  ]);
  const productionCostCents = episodes.reduce((s, e) => s + (e.productionCostCents ?? 0), 0);
  const revenueCents = revenues.reduce((s, r) => s + r.amountCents, 0);
  return {
    episodeCount: episodes.length,
    publishedCount: episodes.filter((e) => e.stage === "Published").length,
    inProductionCount: episodes.filter((e) => e.stage !== "Published" && e.stage !== "Concept").length,
    productionCostCents,
    revenueCents,
    netCents: revenueCents - productionCostCents,
    roiPct: contentRoiPct(productionCostCents, revenueCents),
    funnel: pipelineFunnel(episodes),
  };
}

export async function listSocialPosts(ctx: AuthContext) {
  requirePermission(ctx, "media:read");
  const posts = await prisma.socialPost.findMany({
    include: { episode: { select: { title: true } } },
    orderBy: [{ createdAt: "asc" }],
  });
  return {
    posts: posts.map((p) => ({ ...p, episodeTitle: p.episode?.title ?? null })),
    funnel: socialFunnel(posts),
    scheduledCount: posts.filter((p) => p.status === "Scheduled").length,
    publishedCount: posts.filter((p) => p.status === "Published").length,
    reviewCount: posts.filter((p) => p.status === "Sponsor Review").length,
  };
}

/** Episodes for the "generate post set" picker. */
export async function listEpisodesForSelect(ctx: AuthContext) {
  requirePermission(ctx, "media:read");
  return prisma.episode.findMany({ select: { id: true, title: true }, orderBy: { createdAt: "asc" } });
}

export async function listSeriesForSelect(ctx: AuthContext) {
  requirePermission(ctx, "media:read");
  return prisma.contentSeries.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
}

// ---- writes -----------------------------------------------------------------

export async function createSeries(ctx: AuthContext, data: Omit<ContentSeries, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">) {
  requirePermission(ctx, "media:write");
  const row = await prisma.contentSeries.create({ data: { ...data, createdById: ctx.userId, updatedById: ctx.userId } });
  await writeAudit({ entityType: "ContentSeries", entityId: row.id, action: "create", after: row, userId: ctx.userId });
  return row;
}

export async function createEpisode(ctx: AuthContext, data: Omit<Episode, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">) {
  requirePermission(ctx, "media:write");
  const row = await prisma.episode.create({ data: { ...data, createdById: ctx.userId, updatedById: ctx.userId } });
  await writeAudit({ entityType: "Episode", entityId: row.id, action: "create", after: row, userId: ctx.userId });
  return row;
}

export async function createSocialPost(ctx: AuthContext, data: Omit<SocialPost, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">) {
  requirePermission(ctx, "media:write");
  const row = await prisma.socialPost.create({ data: { ...data, createdById: ctx.userId, updatedById: ctx.userId } });
  await writeAudit({ entityType: "SocialPost", entityId: row.id, action: "create", after: row, userId: ctx.userId });
  return row;
}

export async function addContentRevenue(ctx: AuthContext, data: Omit<ContentRevenue, "id" | "createdAt" | "createdById">) {
  requirePermission(ctx, "media:write");
  const row = await prisma.contentRevenue.create({ data: { ...data, createdById: ctx.userId } });
  await writeAudit({ entityType: "ContentRevenue", entityId: row.id, action: "create", after: row, userId: ctx.userId });
  return row;
}

/**
 * Auto-spawn the standard multi-platform post set for an episode (Section 16).
 * Skips platform/kind pairs that already exist for the episode so it's safe to
 * re-run. Returns the number of posts created.
 */
export async function generatePostSetForEpisode(ctx: AuthContext, episodeId: string) {
  requirePermission(ctx, "media:write");
  const episode = await prisma.episode.findUnique({ where: { id: episodeId }, include: { posts: true } });
  if (!episode) throw new Error("Episode not found.");
  const existing = new Set(episode.posts.map((p) => `${p.platform}|${p.title}`));
  const specs = defaultPostSet(episode.title).filter((s) => !existing.has(`${s.platform}|${s.title}`));
  if (specs.length === 0) return 0;
  await prisma.socialPost.createMany({
    data: specs.map((s) => ({
      episodeId: episode.id,
      vehicleId: episode.vehicleId,
      platform: s.platform,
      kind: s.kind,
      title: s.title,
      status: "Idea",
      autoGenerated: true,
      createdById: ctx.userId,
      updatedById: ctx.userId,
    })),
  });
  await writeAudit({ entityType: "Episode", entityId: episode.id, action: "generate_post_set", after: { created: specs.length }, userId: ctx.userId });
  return specs.length;
}
