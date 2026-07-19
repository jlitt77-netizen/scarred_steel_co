import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/rbac";

/** Fabricate an AuthContext for tests without touching the users table. */
export function makeCtx(
  permissions: string[],
  opts: { isInternal?: boolean; userId?: string } = {},
): AuthContext {
  return {
    userId: opts.userId ?? "test-user",
    email: "test@example.com",
    name: "Test User",
    isInternal: opts.isInternal ?? true,
    roleKeys: ["test"],
    permissions: new Set(permissions),
  };
}

/** Truncate all tables between tests. Order respects FK dependencies. */
export async function resetDb() {
  await prisma.dependency.deleteMany();
  await prisma.event.deleteMany();
  await prisma.task.deleteMany();
  await prisma.buildPhase.deleteMany();
  await prisma.changeLog.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.project.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
}
