"use server";

import { revalidatePath } from "next/cache";
import { requireAuthWithPermission } from "@/lib/auth";
import { createTeamMember } from "@/server/services/workforce";
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

export async function addTeamMemberAction(_p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("project:write");
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };
  try {
    await createTeamMember(ctx, {
      name,
      relationship: str(fd.get("relationship")),
      role: String(fd.get("role") || "Other"),
      engagementType: String(fd.get("engagementType") || "contractor"),
      hourlyRateCents: cents(fd.get("hourlyRate")),
      salaryCents: cents(fd.get("salary")),
      benefitsCents: cents(fd.get("benefits")),
      payrollBurdenPct: num(fd.get("payrollBurdenPct")),
      bonusCents: cents(fd.get("bonus")),
      capacityHoursPerWeek: num(fd.get("capacityHoursPerWeek")),
      active: true,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/os/workforce");
  return { ok: true };
}
