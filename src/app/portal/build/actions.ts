"use server";

import { revalidatePath } from "next/cache";
import { requireAuthWithPermission } from "@/lib/auth";
import { respondToChangeOrder } from "@/server/services/portal";

export async function changeOrderDecisionAction(id: string, approve: boolean): Promise<{ ok?: boolean; error?: string }> {
  const ctx = await requireAuthWithPermission("portal:customer");
  try {
    await respondToChangeOrder(ctx, id, approve);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/portal/build");
  return { ok: true };
}
