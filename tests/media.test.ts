import { describe, it, expect } from "vitest";
import {
  episodeRevenueCents, revenueBySource, episodeNetCents, contentRoiPct,
  pipelineFunnel, socialFunnel, defaultPostSet,
} from "@/server/media/pipeline";
import { EPISODE_STAGES, SOCIAL_POST_STATUSES } from "@/lib/enums";
import { toCents } from "@/lib/money";

describe("episode economics", () => {
  const revenues = [
    { source: "Ad", amountCents: toCents(800) },
    { source: "Sponsor", amountCents: toCents(3000) },
    { source: "Affiliate", amountCents: toCents(200) },
    { source: "Ad", amountCents: toCents(100) },
  ];

  it("sums attributed revenue and groups by source", () => {
    expect(episodeRevenueCents(revenues)).toBe(toCents(4100));
    expect(revenueBySource(revenues)).toEqual({
      Ad: toCents(900), Sponsor: toCents(3000), Affiliate: toCents(200),
    });
    expect(episodeRevenueCents(null)).toBe(0);
  });

  it("nets revenue against production cost", () => {
    expect(episodeNetCents({ stage: "Published", productionCostCents: toCents(1500), revenues })).toBe(toCents(2600));
    expect(episodeNetCents({ stage: "Concept" })).toBe(0);
  });

  it("computes ROI percent and guards zero cost", () => {
    expect(contentRoiPct(toCents(1000), toCents(1500))).toBe(50);
    expect(contentRoiPct(toCents(1000), toCents(500))).toBe(-50);
    expect(contentRoiPct(0, toCents(500))).toBe(0);
  });
});

describe("pipeline funnels", () => {
  it("counts episodes per stage in canonical order with zeros", () => {
    const f = pipelineFunnel([
      { stage: "Concept" }, { stage: "Concept" }, { stage: "Editing" }, { stage: "Published" },
    ]);
    expect(f.map((b) => b.stage)).toEqual([...EPISODE_STAGES]);
    const by = Object.fromEntries(f.map((b) => [b.stage, b.count]));
    expect(by["Concept"]).toBe(2);
    expect(by["Editing"]).toBe(1);
    expect(by["Script"]).toBe(0);
  });

  it("counts social posts per status in canonical order", () => {
    const f = socialFunnel([
      { status: "Idea" }, { status: "Scheduled" }, { status: "Scheduled" }, { status: "Published" },
    ]);
    expect(f.map((b) => b.stage)).toEqual([...SOCIAL_POST_STATUSES]);
    const by = Object.fromEntries(f.map((b) => [b.stage, b.count]));
    expect(by["Scheduled"]).toBe(2);
    expect(by["Published"]).toBe(1);
    expect(by["Draft"]).toBe(0);
  });
});

describe("defaultPostSet", () => {
  it("spawns a full multi-platform set derived from the episode title", () => {
    const set = defaultPostSet("F-150 Suspension Day");
    expect(set.length).toBe(8);
    expect(set.every((p) => p.title.startsWith("F-150 Suspension Day"))).toBe(true);
    const platforms = new Set(set.map((p) => p.platform));
    expect(platforms.has("YouTube")).toBe(true);
    expect(platforms.has("TikTok")).toBe(true);
    expect(platforms.has("Email")).toBe(true);
  });

  it("falls back to a placeholder title when blank", () => {
    expect(defaultPostSet("  ")[0].title).toContain("Untitled Episode");
  });
});
