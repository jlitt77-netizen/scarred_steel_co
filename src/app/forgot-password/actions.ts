"use server";

import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

export interface ForgotState { ok?: boolean; error?: string }

// No email provider is wired yet, so this records the request for the owner to
// action from Settings → Users (Reset password). It never reveals whether an
// account exists (no user enumeration).
export async function requestResetAction(_p: ForgotState, fd: FormData): Promise<ForgotState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return { error: "Enter a valid email address." };
  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      await writeAudit({ entityType: "PasswordReset", entityId: user.id, action: "requested", after: { email }, userId: user.id });
    }
  } catch {
    // Swallow — always return the same neutral response.
  }
  return { ok: true };
}
