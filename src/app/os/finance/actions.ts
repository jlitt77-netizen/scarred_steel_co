"use server";

import { revalidatePath } from "next/cache";
import { requireAuthWithPermission } from "@/lib/auth";
import { createReceivable, createPayable } from "@/server/services/finance";
import { toCents } from "@/lib/money";

export interface FormResult {
  ok?: boolean;
  error?: string;
}

function cents(v: FormDataEntryValue | null): number | null {
  if (v == null || String(v).trim() === "") return null;
  const num = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(num) ? toCents(num) : null;
}
const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};
const dt = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : new Date(s);
};

export async function addReceivableAction(_p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("finance:write");
  const amountCents = cents(fd.get("amount"));
  if (!amountCents || amountCents <= 0) return { error: "Enter a positive amount." };
  try {
    await createReceivable(ctx, {
      type: String(fd.get("type")),
      segment: String(fd.get("segment") || "Other"),
      description: String(fd.get("description") ?? "").trim() || "(no description)",
      amountCents,
      status: "open",
      dueDate: dt(fd.get("dueDate")),
      vehicleId: str(fd.get("vehicleId")),
      projectId: str(fd.get("projectId")),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/os/finance");
  return { ok: true };
}

export async function addPayableAction(_p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("finance:write");
  const amountCents = cents(fd.get("amount"));
  if (!amountCents || amountCents <= 0) return { error: "Enter a positive amount." };
  try {
    await createPayable(ctx, {
      category: String(fd.get("category")),
      segment: String(fd.get("segment") || "Other"),
      vendor: str(fd.get("vendor")),
      description: String(fd.get("description") ?? "").trim() || "(no description)",
      amountCents,
      status: String(fd.get("scheduledCashDate") ? "scheduled" : "open"),
      dueDate: dt(fd.get("dueDate")),
      scheduledCashDate: dt(fd.get("scheduledCashDate")),
      vehicleId: str(fd.get("vehicleId")),
      projectId: str(fd.get("projectId")),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/os/finance");
  return { ok: true };
}
