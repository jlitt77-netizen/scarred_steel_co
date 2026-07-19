import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { makeCtx, resetDb } from "./helpers";
import { ForbiddenError } from "@/lib/rbac";
import { createVehicle, listVehicles, updateVehicle } from "@/server/services/vehicles";
import { createProject } from "@/server/services/projects";
import { createTask } from "@/server/services/tasks";
import { createDependency } from "@/server/services/dependencies";
import { createEvent, moveEventDate } from "@/server/services/events";
import { toCents } from "@/lib/money";

const WRITER = makeCtx([
  "vehicle:read", "vehicle:write",
  "project:read", "project:write",
  "task:read", "task:write",
  "event:read", "event:write",
  "dependency:read", "dependency:write",
]);
const READER = makeCtx(["vehicle:read"]);

// DB-backed suite — runs only when a disposable Postgres URL is provided.
const dbAvailable = !!process.env.TEST_DATABASE_URL;
const d = describe.skipIf(!dbAvailable);

beforeEach(async () => {
  if (dbAvailable) await resetDb();
});

d("vehicle service", () => {
  it("creates a vehicle, computes metrics, and writes an audit record", async () => {
    const v = await createVehicle(WRITER, {
      year: 1975, make: "Ford", model: "F-250", trim: "Highboy",
      status: "Acquired",
      acquisitionCostCents: toCents(12000),
      actualCostCents: toCents(8000),
      sponsorCashCents: toCents(2000),
    } as never);

    expect(v.metrics.trueCashInvestedCents).toBe(toCents(18000));

    const audits = await prisma.auditLog.findMany({ where: { entityType: "Vehicle", entityId: v.id } });
    expect(audits).toHaveLength(1);
    expect(audits[0].action).toBe("create");
  });

  it("denies vehicle creation without vehicle:write", async () => {
    await expect(createVehicle(READER, { year: 1979, make: "Ford", model: "F-150" } as never)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("audits an update with before/after", async () => {
    const v = await createVehicle(WRITER, { year: 1969, make: "Ford", model: "F-100" } as never);
    await updateVehicle(WRITER, v.id, { status: "Active Build" });
    const audits = await prisma.auditLog.findMany({ where: { entityId: v.id, action: "update" } });
    expect(audits).toHaveLength(1);
    const after = JSON.parse(audits[0].afterJson!);
    expect(after.status).toBe("Active Build");
  });

  it("lists vehicles for a reader", async () => {
    await createVehicle(WRITER, { year: 1979, make: "Ford", model: "F-150" } as never);
    const list = await listVehicles(READER);
    expect(list).toHaveLength(1);
    expect(list[0].metrics).toBeDefined();
  });
});

d("scheduling: four-date events", () => {
  it("stores the four dates independently and reschedules one without touching others", async () => {
    const v = await createVehicle(WRITER, { year: 1979, make: "Ford", model: "F-150" } as never);
    const p = await createProject(WRITER, { vehicleId: v.id, name: "Build" } as never);

    const ev = await createEvent(WRITER, {
      title: "Parts payment",
      type: "cash_outflow",
      projectId: p.id,
      workDate: new Date("2026-05-01"),
      cashDate: new Date("2026-04-20"),
      amountCents: toCents(3800),
    } as never);

    expect(ev.workDate?.toISOString().slice(0, 10)).toBe("2026-05-01");
    expect(ev.cashDate?.toISOString().slice(0, 10)).toBe("2026-04-20");
    expect(ev.contentDate).toBeNull();
    expect(ev.revenueDate).toBeNull();

    // Move ONLY the cash date; work date must remain unchanged.
    const moved = await moveEventDate(WRITER, ev.id, "cashDate", new Date("2026-05-05"));
    expect(moved.cashDate?.toISOString().slice(0, 10)).toBe("2026-05-05");
    expect(moved.workDate?.toISOString().slice(0, 10)).toBe("2026-05-01");

    const audit = await prisma.auditLog.findFirst({
      where: { entityType: "Event", entityId: ev.id, action: "reschedule" },
    });
    expect(audit?.field).toBe("cashDate");
  });
});

d("scheduling: dependencies", () => {
  async function twoTasks() {
    const v = await createVehicle(WRITER, { year: 1979, make: "Ford", model: "F-150" } as never);
    const p = await createProject(WRITER, { vehicleId: v.id, name: "Build" } as never);
    const a = await createTask(WRITER, { projectId: p.id, title: "Suspension" } as never);
    const b = await createTask(WRITER, { projectId: p.id, title: "Paint" } as never);
    return { a, b };
  }

  it("creates a valid dependency", async () => {
    const { a, b } = await twoTasks();
    const dep = await createDependency(WRITER, { predecessorId: a.id, successorId: b.id } as never);
    expect(dep.type).toBe("finish_to_start");
  });

  it("rejects a dependency that would create a cycle", async () => {
    const { a, b } = await twoTasks();
    await createDependency(WRITER, { predecessorId: a.id, successorId: b.id } as never);
    // b -> a would close a loop
    await expect(
      createDependency(WRITER, { predecessorId: b.id, successorId: a.id } as never),
    ).rejects.toThrow(/circular/i);
  });

  it("rejects a longer transitive cycle (a->b->c, then c->a)", async () => {
    const v = await createVehicle(WRITER, { year: 1979, make: "Ford", model: "F-150" } as never);
    const p = await createProject(WRITER, { vehicleId: v.id, name: "Build" } as never);
    const a = await createTask(WRITER, { projectId: p.id, title: "A" } as never);
    const b = await createTask(WRITER, { projectId: p.id, title: "B" } as never);
    const c = await createTask(WRITER, { projectId: p.id, title: "C" } as never);
    await createDependency(WRITER, { predecessorId: a.id, successorId: b.id } as never);
    await createDependency(WRITER, { predecessorId: b.id, successorId: c.id } as never);
    await expect(
      createDependency(WRITER, { predecessorId: c.id, successorId: a.id } as never),
    ).rejects.toThrow(/circular/i);
  });
});
