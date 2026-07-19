import { describe, it, expect } from "vitest";
import {
  sponsorTotalValueCents, pipelineFunnel, activeValueCents,
  deliverableFunnel, isOverdue, deliverablesDue, renewalsDue,
} from "@/server/sponsors/pipeline";
import { SPONSOR_STAGES, DELIVERABLE_STATUSES } from "@/lib/enums";
import { toCents } from "@/lib/money";

const NOW = new Date("2026-07-19T00:00:00Z");
const daysFromNow = (n: number) => new Date(NOW.getTime() + n * 86400000);

describe("sponsor value + pipeline", () => {
  const sponsors = [
    { stage: "Prospect", cashValueCents: toCents(1000) },
    { stage: "Active", active: true, cashValueCents: toCents(3000), productValueCents: toCents(2000) },
    { stage: "Active", active: true, cashValueCents: toCents(1000) },
    { stage: "Renewal", active: true, productValueCents: toCents(500) },
    { stage: "Lost", cashValueCents: toCents(9999) },
  ];

  it("blends cash + product into total value", () => {
    expect(sponsorTotalValueCents(sponsors[1])).toBe(toCents(5000));
    expect(sponsorTotalValueCents({ stage: "Prospect" })).toBe(0);
  });

  it("funnels count + value per stage in canonical order", () => {
    const f = pipelineFunnel(sponsors);
    expect(f.map((b) => b.stage)).toEqual([...SPONSOR_STAGES]);
    const by = Object.fromEntries(f.map((b) => [b.stage, b]));
    expect(by["Active"].count).toBe(2);
    expect(by["Active"].valueCents).toBe(toCents(6000));
    expect(by["Prospect"].valueCents).toBe(toCents(1000));
  });

  it("sums only active + renewal sponsors for active value", () => {
    // 5000 + 1000 (Active) + 500 (Renewal) = 6500; Prospect and Lost excluded
    expect(activeValueCents(sponsors)).toBe(toCents(6500));
  });
});

describe("deliverables", () => {
  const deliverables = [
    { status: "Planned", dueDate: daysFromNow(-3) },   // overdue
    { status: "Submitted", dueDate: daysFromNow(5) },  // due soon
    { status: "In Progress", dueDate: daysFromNow(30) }, // upcoming, not soon
    { status: "Published", dueDate: daysFromNow(-10) }, // closed, ignored
    { status: "Approved", dueDate: null },              // open, no date
  ];

  it("counts per status in canonical order", () => {
    const f = deliverableFunnel(deliverables);
    expect(f.map((b) => b.status)).toEqual([...DELIVERABLE_STATUSES]);
    expect(Object.fromEntries(f.map((b) => [b.status, b.count]))["Planned"]).toBe(1);
  });

  it("flags overdue only for unpublished past-due items", () => {
    expect(isOverdue(deliverables[0], NOW)).toBe(true);
    expect(isOverdue(deliverables[3], NOW)).toBe(false); // published
    expect(isOverdue(deliverables[1], NOW)).toBe(false); // future
  });

  it("summarizes due/overdue within the window", () => {
    const s = deliverablesDue(deliverables, NOW, 14);
    expect(s.overdue).toBe(1);
    expect(s.dueSoon).toBe(1); // the +5d one; +30d is beyond 14d
    expect(s.openTotal).toBe(4); // all but the Published one
  });
});

describe("renewals", () => {
  it("counts renewals within the window", () => {
    const sponsors = [
      { stage: "Active", renewalDate: daysFromNow(30) },  // in
      { stage: "Renewal", renewalDate: daysFromNow(90) }, // out (>60)
      { stage: "Active", renewalDate: daysFromNow(-5) },  // past
      { stage: "Active", renewalDate: null },
    ];
    expect(renewalsDue(sponsors, NOW, 60)).toBe(1);
  });
});
