"use server";

import { revalidatePath } from "next/cache";
import { requireAuthWithPermission } from "@/lib/auth";
import { createWorkOrder } from "@/server/services/workforce";
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
const dt = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : new Date(s);
};

export async function addWorkOrderAction(_p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("project:write");
  const title = String(fd.get("title") ?? "").trim();
  if (!title) return { error: "Title is required." };
  try {
    await createWorkOrder(ctx, {
      partnerShopId: str(fd.get("partnerShopId")),
      projectId: str(fd.get("projectId")),
      vehicleId: str(fd.get("vehicleId")),
      title,
      type: String(fd.get("type") || "hourly"),
      status: String(fd.get("status") || "draft"),
      estimatedHours: num(fd.get("estimatedHours")),
      actualHours: num(fd.get("actualHours")),
      hourlyRateCents: cents(fd.get("hourlyRate")),
      fixedPriceCents: cents(fd.get("fixedPrice")),
      scheduledStart: dt(fd.get("scheduledStart")),
      scheduledEnd: dt(fd.get("scheduledEnd")),
      invoicedCents: cents(fd.get("invoiced")),
      notes: str(fd.get("notes")),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/os/partner-shop");
  return { ok: true };
}
