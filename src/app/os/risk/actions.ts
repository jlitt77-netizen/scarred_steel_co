"use server";

import { revalidatePath } from "next/cache";
import { requireAuthWithPermission } from "@/lib/auth";
import { createRisk, updateRisk } from "@/server/services/risks";
import type { RiskCreateInput } from "@/lib/validation";

export interface FormResult { ok?: boolean; error?: string }

const num = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
const cents = (v: FormDataEntryValue | null) => {
  const n = num(v);
  return n == null ? null : Math.round(n * 100);
};
const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? undefined : s;
};

export async function addRiskAction(_p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("risk:write");
  const title = String(fd.get("title") ?? "").trim();
  if (!title) return { error: "Title is required." };
  // The service validates category/severity/likelihood/status/response against
  // the enum schema, so raw form strings are safe to pass through.
  const input = {
    category: String(fd.get("category") || "Parts Delay"),
    title,
    description: str(fd.get("description")),
    severity: String(fd.get("severity") || "medium"),
    likelihood: String(fd.get("likelihood") || "medium"),
    status: String(fd.get("status") || "open"),
    responseOption: str(fd.get("responseOption")) ?? null,
    scheduleImpactDays: num(fd.get("scheduleImpactDays")),
    costImpactCents: cents(fd.get("costImpact")),
    revenueImpactCents: cents(fd.get("revenueImpact")),
    cashImpactCents: cents(fd.get("cashImpact")),
  } as unknown as RiskCreateInput;
  try {
    await createRisk(ctx, input);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/os/risk");
  revalidatePath("/os");
  return { ok: true };
}

export async function setRiskStatusAction(id: string, status: string): Promise<void> {
  const ctx = await requireAuthWithPermission("risk:write");
  await updateRisk(ctx, id, { status });
  revalidatePath("/os/risk");
  revalidatePath("/os");
}
