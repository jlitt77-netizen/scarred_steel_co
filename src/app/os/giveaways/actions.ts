"use server";

import { revalidatePath } from "next/cache";
import { requireAuthWithPermission } from "@/lib/auth";
import { createGiveaway, setGiveawayGate, launchGiveaway } from "@/server/services/giveaways";
import { toCents } from "@/lib/money";

export interface FormResult { ok?: boolean; error?: string }

const cents = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? toCents(n) : null;
};
const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};
const dt = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : new Date(s);
};

export async function addGiveawayAction(_p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("giveaway:write");
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };
  try {
    await createGiveaway(ctx, {
      name,
      prizeDescription: str(fd.get("prizeDescription")),
      prizeValueCents: cents(fd.get("prizeValue")),
      vehicleId: str(fd.get("vehicleId")),
      stage: String(fd.get("stage") || "Concept"),
      status: "Planning",
      attorneyReviewed: false, rulesApproved: false, eligibilityDefined: false, taxPlanApproved: false, funded: false,
      launchDate: dt(fd.get("launchDate")),
      endDate: dt(fd.get("endDate")),
      drawDate: dt(fd.get("drawDate")),
      winnerName: null, winnerVerified: false, prizeTransferred: false, taxDocsSent: false,
      notes: str(fd.get("notes")),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/os/giveaways");
  revalidatePath("/os/calendar");
  return { ok: true };
}

export async function toggleGateAction(id: string, gate: string, value: boolean): Promise<void> {
  const ctx = await requireAuthWithPermission("giveaway:write");
  await setGiveawayGate(ctx, id, gate, value);
  revalidatePath("/os/giveaways");
}

export async function launchGiveawayAction(id: string): Promise<{ ok?: boolean; error?: string }> {
  const ctx = await requireAuthWithPermission("giveaway:write");
  try {
    await launchGiveaway(ctx, id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/os/giveaways");
  revalidatePath("/os/calendar");
  return { ok: true };
}
