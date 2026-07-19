"use server";

import { revalidatePath } from "next/cache";
import { requireAuthWithPermission } from "@/lib/auth";
import { upsertFleetAssessment } from "@/server/services/fleet";
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

export async function saveAssessmentAction(_p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("vehicle:write");
  const vehicleId = String(fd.get("vehicleId") ?? "").trim();
  if (!vehicleId) return { error: "Pick a vehicle." };
  try {
    await upsertFleetAssessment(ctx, vehicleId, {
      insuranceAnnualCents: cents(fd.get("insurance")),
      storageAnnualCents: cents(fd.get("storage")),
      opportunityCostAnnualCents: cents(fd.get("opportunity")),
      mediaValueAnnualCents: cents(fd.get("media")),
      sponsorValueAnnualCents: cents(fd.get("sponsor")),
      affiliateValueAnnualCents: cents(fd.get("affiliate")),
      merchValueAnnualCents: cents(fd.get("merch")),
      eventValueAnnualCents: cents(fd.get("event")),
      brandValueAnnualCents: cents(fd.get("brand")),
      notes: str(fd.get("notes")),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/os/fleet");
  return { ok: true };
}
