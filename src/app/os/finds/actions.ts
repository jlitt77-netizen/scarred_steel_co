"use server";

import { revalidatePath } from "next/cache";
import { requireAuthWithPermission } from "@/lib/auth";
import { createFind, setFindStage } from "@/server/services/programs";
import { toCents } from "@/lib/money";

export interface FormResult { ok?: boolean; error?: string }

const num = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
const cents = (v: FormDataEntryValue | null) => {
  const n = num(v);
  return n == null ? null : toCents(n);
};
const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

export async function addFindAction(_p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("vehicle:write");
  const vehicleDesc = String(fd.get("vehicleDesc") ?? "").trim();
  if (!vehicleDesc) return { error: "Vehicle description is required." };
  try {
    await createFind(ctx, {
      vehicleDesc,
      submitterName: str(fd.get("submitterName")),
      submitterEmail: str(fd.get("submitterEmail")),
      year: num(fd.get("year")),
      make: str(fd.get("make")),
      model: str(fd.get("model")),
      location: str(fd.get("location")),
      askingPriceCents: cents(fd.get("askingPrice")),
      photoUrl: str(fd.get("photoUrl")),
      notes: str(fd.get("notes")),
      stage: String(fd.get("stage") || "New"),
      valuePath: str(fd.get("valuePath")),
      vehicleId: null,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/os/finds");
  return { ok: true };
}

export async function setFindStageAction(id: string, stage: string): Promise<void> {
  const ctx = await requireAuthWithPermission("vehicle:write");
  await setFindStage(ctx, id, stage);
  revalidatePath("/os/finds");
}
