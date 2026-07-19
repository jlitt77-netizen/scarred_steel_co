"use server";

import { revalidatePath } from "next/cache";
import { requireAuthWithPermission } from "@/lib/auth";
import { createRescue, setRescueStage } from "@/server/services/programs";

export interface FormResult { ok?: boolean; error?: string }

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

export async function addRescueAction(_p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("vehicle:write");
  const title = String(fd.get("title") ?? "").trim();
  if (!title) return { error: "Title is required." };
  try {
    await createRescue(ctx, {
      title,
      vehicleDesc: str(fd.get("vehicleDesc")),
      location: str(fd.get("location")),
      stage: String(fd.get("stage") || "Find"),
      outcome: str(fd.get("outcome")),
      seriesId: null,
      vehicleId: null,
      notes: str(fd.get("notes")),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/os/rescues");
  return { ok: true };
}

export async function setRescueStageAction(id: string, stage: string): Promise<void> {
  const ctx = await requireAuthWithPermission("vehicle:write");
  await setRescueStage(ctx, id, stage);
  revalidatePath("/os/rescues");
}
