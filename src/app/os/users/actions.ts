"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { requireAuthWithPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { writeAudit } from "@/lib/audit";

// Generate a readable temporary password like "Steel-7Q4K-2F9M".
function tempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const block = () => Array.from({ length: 4 }, () => chars[crypto.randomInt(chars.length)]).join("");
  return `Steel-${block()}-${block()}`;
}

export async function resetUserPasswordAction(userId: string): Promise<{ ok?: boolean; password?: string; error?: string }> {
  const ctx = await requireAuthWithPermission("user:write");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!user) return { error: "User not found." };
  const password = tempPassword();
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password) } });
  await writeAudit({ entityType: "User", entityId: userId, action: "password_reset", after: { by: ctx.userId }, userId: ctx.userId });
  revalidatePath("/os/users");
  return { ok: true, password };
}
