import { describe, it, expect } from "vitest";
import { signSessionToken, verifySessionToken } from "@/lib/session-token";

describe("session token", () => {
  it("signs and verifies a valid payload", async () => {
    const token = await signSessionToken({
      userId: "u1",
      email: "a@b.com",
      isInternal: true,
    });
    const payload = await verifySessionToken(token);
    expect(payload).toMatchObject({ userId: "u1", email: "a@b.com", isInternal: true });
  });

  it("rejects a tampered token", async () => {
    const token = await signSessionToken({ userId: "u1", email: "a@b.com", isInternal: false });
    const tampered = token.slice(0, -3) + "abc";
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("rejects garbage", async () => {
    expect(await verifySessionToken("not-a-jwt")).toBeNull();
  });
});
