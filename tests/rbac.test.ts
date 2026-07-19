import { describe, it, expect } from "vitest";
import {
  PERMISSIONS,
  ROLES,
  assertCatalogIntegrity,
  resolveRolePermissions,
} from "@/lib/rbac-catalog";
import { can, canAny, isConfidentialPermission, requirePermission, ForbiddenError } from "@/lib/rbac";
import { makeCtx } from "./helpers";
import { CEO_OS_COMMAND_CENTER_COUNT } from "@/lib/navigation";

describe("RBAC catalog integrity", () => {
  it("passes structural + security invariants", () => {
    expect(() => assertCatalogIntegrity()).not.toThrow();
  });

  it("has exactly 15 CEO OS command centers", () => {
    expect(CEO_OS_COMMAND_CENTER_COUNT).toBe(15);
  });

  it("gives the CEO every permission", () => {
    const ceo = ROLES.find((r) => r.key === "ceo")!;
    expect(resolveRolePermissions(ceo).sort()).toEqual(
      PERMISSIONS.map((p) => p.key).sort(),
    );
  });

  it("NEVER grants a confidential permission to an external role", () => {
    const confidential = new Set(
      PERMISSIONS.filter((p) => p.isConfidential).map((p) => p.key),
    );
    for (const role of ROLES.filter((r) => !r.isInternal)) {
      const keys = resolveRolePermissions(role);
      for (const k of keys) {
        expect(confidential.has(k)).toBe(false);
      }
    }
  });

  it("detects an unsafe external->confidential grant", () => {
    // Simulate a bad edit by checking the guard rejects it.
    const bad = {
      key: "hacker",
      name: "Hacker",
      description: "",
      isInternal: false,
      permissions: ["finance:read_confidential"],
    };
    const original = ROLES.length;
    ROLES.push(bad as never);
    try {
      expect(() => assertCatalogIntegrity()).toThrow(/confidential/i);
    } finally {
      ROLES.length = original; // restore
    }
  });
});

describe("RBAC runtime enforcement", () => {
  it("allows granted permissions", () => {
    const ctx = makeCtx(["vehicle:read"]);
    expect(can(ctx, "vehicle:read")).toBe(true);
    expect(can(ctx, "vehicle:write")).toBe(false);
  });

  it("returns false for a null context", () => {
    expect(can(null, "vehicle:read")).toBe(false);
  });

  it("blocks confidential permissions for external users even if attached (defense in depth)", () => {
    const external = makeCtx(["finance:read_confidential"], { isInternal: false });
    expect(isConfidentialPermission("finance:read_confidential")).toBe(true);
    expect(can(external, "finance:read_confidential")).toBe(false);
    // ...but an internal user with the grant is allowed
    const internal = makeCtx(["finance:read_confidential"], { isInternal: true });
    expect(can(internal, "finance:read_confidential")).toBe(true);
  });

  it("canAny works across a list", () => {
    const ctx = makeCtx(["media:read"]);
    expect(canAny(ctx, ["finance:read", "media:read"])).toBe(true);
    expect(canAny(ctx, ["finance:read", "sponsor:read"])).toBe(false);
  });

  it("requirePermission throws ForbiddenError when missing", () => {
    const ctx = makeCtx([]);
    expect(() => requirePermission(ctx, "vehicle:read")).toThrow(ForbiddenError);
  });
});
