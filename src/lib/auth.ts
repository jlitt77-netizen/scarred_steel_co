import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";
import { loadAuthContext, type AuthContext, requirePermission } from "./rbac";
import { readSession } from "./session";
import { writeAudit } from "./audit";

/** Verify credentials. Returns the user id on success, null on failure.
 *  Uses a constant-ish path so a missing user and a bad password look alike. */
export async function authenticate(
  email: string,
  password: string,
): Promise<{ userId: string; isInternal: boolean; email: string } | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user || !user.isActive) {
    // Still run a compare to reduce timing signal.
    await verifyPassword(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinv");
    return null;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    await writeAudit({
      entityType: "User",
      entityId: user.id,
      action: "login_failed",
      userId: user.id,
    });
    return null;
  }
  await writeAudit({
    entityType: "User",
    entityId: user.id,
    action: "login",
    userId: user.id,
  });
  return { userId: user.id, isInternal: user.isInternal, email: user.email };
}

/** Current auth context from the session cookie, or null if signed out. */
export async function getAuth(): Promise<AuthContext | null> {
  const session = await readSession();
  if (!session) return null;
  return loadAuthContext(session.userId);
}

/** Require any authenticated user; redirect to /login otherwise. */
export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuth();
  if (!ctx) redirect("/login");
  return ctx;
}

/** Require an internal (CEO OS) user; redirect appropriately otherwise. */
export async function requireInternal(): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!ctx.isInternal) redirect("/portal");
  return ctx;
}

/** Require a specific permission; redirect to a safe home on failure. */
export async function requireAuthWithPermission(
  permission: string,
): Promise<AuthContext> {
  const ctx = await requireAuth();
  try {
    requirePermission(ctx, permission);
  } catch {
    redirect(ctx.isInternal ? "/os" : "/portal");
  }
  return ctx;
}
