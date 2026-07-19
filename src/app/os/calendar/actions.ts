"use server";

import { revalidatePath } from "next/cache";
import { requireAuthWithPermission } from "@/lib/auth";
import { previewReschedule, applyReschedule } from "@/server/services/reschedule";
import type { ImpactPreview } from "@/server/scheduling/impact";

export interface PreviewState {
  impact?: ImpactPreview;
  error?: string;
  taskId?: string;
  deltaDays?: number;
}

export async function previewRescheduleAction(
  taskId: string,
  deltaDays: number,
): Promise<PreviewState> {
  const ctx = await requireAuthWithPermission("event:write");
  if (!taskId) return { error: "This event isn't linked to a build task, so it can't cascade." };
  if (!Number.isInteger(deltaDays) || deltaDays === 0) return { error: "Enter a non-zero number of days." };
  try {
    const impact = await previewReschedule(ctx, taskId, deltaDays);
    return { impact, taskId, deltaDays };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to compute impact." };
  }
}

export async function applyRescheduleAction(
  taskId: string,
  deltaDays: number,
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireAuthWithPermission("event:write");
  try {
    await applyReschedule(ctx, taskId, deltaDays);
    revalidatePath("/os/calendar");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to apply reschedule." };
  }
}
