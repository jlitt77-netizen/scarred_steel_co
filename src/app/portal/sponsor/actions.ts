"use server";

import { revalidatePath } from "next/cache";
import { requireAuthWithPermission } from "@/lib/auth";
import { respondToDeliverable } from "@/server/services/portal";

export async function deliverableDecisionAction(id: string, approve: boolean): Promise<{ ok?: boolean; error?: string }> {
  const ctx = await requireAuthWithPermission("portal:sponsor");
  try {
    await respondToDeliverable(ctx, id, approve);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/portal/sponsor");
  return { ok: true };
}
