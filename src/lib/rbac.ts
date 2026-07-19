import { prisma } from "./prisma";
import { PERMISSIONS } from "./rbac-catalog";

// Runtime permission resolution + enforcement.

const CONFIDENTIAL_KEYS = new Set(
  PERMISSIONS.filter((p) => p.isConfidential).map((p) => p.key),
);

export function isConfidentialPermission(key: string): boolean {
  return CONFIDENTIAL_KEYS.has(key);
}

export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  isInternal: boolean;
  roleKeys: string[];
  permissions: Set<string>;
}

/** Load a user's full auth context (roles + effective permissions). */
export async function loadAuthContext(userId: string): Promise<AuthContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: { include: { permissions: { include: { permission: true } } } },
        },
      },
    },
  });
  if (!user || !user.isActive) return null;

  const permissions = new Set<string>();
  const roleKeys: string[] = [];
  for (const ur of user.roles) {
    roleKeys.push(ur.role.key);
    for (const rp of ur.role.permissions) {
      permissions.add(rp.permission.key);
    }
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    isInternal: user.isInternal,
    roleKeys,
    permissions,
  };
}

export function can(ctx: AuthContext | null, permission: string): boolean {
  if (!ctx) return false;
  // Defense in depth: an external user can never exercise a confidential
  // permission even if one were mistakenly attached to their role.
  if (!ctx.isInternal && isConfidentialPermission(permission)) return false;
  return ctx.permissions.has(permission);
}

export function canAny(ctx: AuthContext | null, permissions: string[]): boolean {
  return permissions.some((p) => can(ctx, p));
}

export class ForbiddenError extends Error {
  constructor(public permission: string) {
    super(`Forbidden: missing permission "${permission}".`);
    this.name = "ForbiddenError";
  }
}

/** Throws ForbiddenError when the context lacks the permission. */
export function requirePermission(ctx: AuthContext | null, permission: string): void {
  if (!can(ctx, permission)) throw new ForbiddenError(permission);
}
