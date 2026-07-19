import { describe, it, expect } from "vitest";
import {
  vehicleCreateSchema,
  eventCreateSchema,
  dependencyCreateSchema,
  taskCreateSchema,
} from "@/lib/validation";

describe("validation schemas", () => {
  it("accepts a valid vehicle and rejects a bad status", () => {
    expect(vehicleCreateSchema.safeParse({ year: 1979, make: "Ford", model: "F-150" }).success).toBe(true);
    expect(
      vehicleCreateSchema.safeParse({ year: 1979, make: "Ford", model: "F-150", status: "Nope" }).success,
    ).toBe(false);
  });

  it("rejects out-of-range year", () => {
    expect(vehicleCreateSchema.safeParse({ year: 1800, make: "Ford", model: "X" }).success).toBe(false);
  });

  it("requires at least one of the four dates on an event", () => {
    const noDates = eventCreateSchema.safeParse({ title: "x", type: "work" });
    expect(noDates.success).toBe(false);
    const oneDate = eventCreateSchema.safeParse({ title: "x", type: "work", workDate: new Date() });
    expect(oneDate.success).toBe(true);
  });

  it("keeps the four dates independent (accepts only a revenue date)", () => {
    const r = eventCreateSchema.safeParse({
      title: "royalty",
      type: "revenue",
      revenueDate: new Date("2026-09-30"),
    });
    expect(r.success).toBe(true);
  });

  it("rejects a self-referential dependency", () => {
    expect(dependencyCreateSchema.safeParse({ predecessorId: "a", successorId: "a" }).success).toBe(false);
    expect(dependencyCreateSchema.safeParse({ predecessorId: "a", successorId: "b" }).success).toBe(true);
  });

  it("clamps percentComplete to 0..100", () => {
    expect(taskCreateSchema.safeParse({ projectId: "p", title: "t", percentComplete: 150 }).success).toBe(false);
  });
});
