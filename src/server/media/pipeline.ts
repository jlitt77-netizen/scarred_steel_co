// Pure media & content math (Sections 14–16). No DB. Money in cents.
//
// Two pipelines: the EPISODE production pipeline (concept → script → film →
// edit → publish) and the SOCIAL publishing pipeline (idea → … → published).
// Plus per-episode economics (production cost vs attributed revenue) and the
// standard post-set an episode spawns.

import { EPISODE_STAGES, SOCIAL_POST_STATUSES } from "@/lib/enums";

export interface RevenueLite {
  source: string; // Ad | Sponsor | Affiliate | Merch
  amountCents: number;
}

export interface EpisodeLite {
  stage: string;
  productionCostCents?: number | null;
  revenues?: RevenueLite[];
}

// ---- episode economics ------------------------------------------------------

export function episodeRevenueCents(revenues: RevenueLite[] | null | undefined): number {
  return (revenues ?? []).reduce((s, r) => s + (r.amountCents ?? 0), 0);
}

/** Attributed revenue grouped by source, in a stable key order. */
export function revenueBySource(revenues: RevenueLite[] | null | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of revenues ?? []) out[r.source] = (out[r.source] ?? 0) + (r.amountCents ?? 0);
  return out;
}

/** Net contribution of an episode: attributed revenue − production cost. */
export function episodeNetCents(ep: EpisodeLite): number {
  return episodeRevenueCents(ep.revenues) - (ep.productionCostCents ?? 0);
}

/** Return on production spend, as a whole-number percent. 0 cost → 0. */
export function contentRoiPct(costCents: number, revenueCents: number): number {
  if (costCents <= 0) return 0;
  return Math.round(((revenueCents - costCents) / costCents) * 100);
}

// ---- pipelines --------------------------------------------------------------

export interface FunnelBucket {
  stage: string;
  count: number;
}

/** Episode counts per stage, in canonical stage order (zeros included). */
export function pipelineFunnel(episodes: { stage: string }[]): FunnelBucket[] {
  const counts = new Map<string, number>(EPISODE_STAGES.map((s) => [s, 0]));
  for (const e of episodes) counts.set(e.stage, (counts.get(e.stage) ?? 0) + 1);
  return EPISODE_STAGES.map((stage) => ({ stage, count: counts.get(stage) ?? 0 }));
}

/** Social-post counts per status, in canonical status order (zeros included). */
export function socialFunnel(posts: { status: string }[]): FunnelBucket[] {
  const counts = new Map<string, number>(SOCIAL_POST_STATUSES.map((s) => [s, 0]));
  for (const p of posts) counts.set(p.status, (counts.get(p.status) ?? 0) + 1);
  return SOCIAL_POST_STATUSES.map((stage) => ({ stage, count: counts.get(stage) ?? 0 }));
}

// ---- auto-generated post set ------------------------------------------------

export interface PostSpec {
  platform: string;
  kind: string;
  title: string;
}

/**
 * The standard multi-platform set of posts an episode spawns (Section 16).
 * One long-form YouTube launch, a trio of vertical Shorts/Reels/TikTok, a
 * Facebook post, and an email blast. Pure — derives titles from the episode
 * title so the caller can persist them verbatim.
 */
export function defaultPostSet(episodeTitle: string): PostSpec[] {
  const t = episodeTitle.trim() || "Untitled Episode";
  return [
    { platform: "YouTube", kind: "Post", title: `${t} — Full Episode` },
    { platform: "YouTube", kind: "Teaser", title: `${t} — Teaser` },
    { platform: "YouTube Shorts", kind: "Short", title: `${t} — Short` },
    { platform: "Instagram Reels", kind: "Reel", title: `${t} — Reel` },
    { platform: "TikTok", kind: "Short", title: `${t} — TikTok` },
    { platform: "Instagram", kind: "Post", title: `${t} — Carousel` },
    { platform: "Facebook", kind: "Post", title: `${t} — Facebook` },
    { platform: "Email", kind: "Email", title: `${t} — Email Drop` },
  ];
}
