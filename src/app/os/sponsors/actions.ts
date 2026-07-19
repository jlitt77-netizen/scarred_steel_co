"use server";

import { revalidatePath } from "next/cache";
import { requireAuthWithPermission } from "@/lib/auth";
import { createSponsor, createDeliverable, setDeliverableStatus } from "@/server/services/sponsors";
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

export async function addSponsorAction(_p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("sponsor:write");
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };
  try {
    await createSponsor(ctx, {
      name,
      contactName: str(fd.get("contactName")),
      email: str(fd.get("email")),
      website: str(fd.get("website")),
      stage: String(fd.get("stage") || "Prospect"),
      level: str(fd.get("level")),
      exclusive: fd.get("exclusive") === "on",
      exclusiveCategory: str(fd.get("exclusiveCategory")),
      cashValueCents: cents(fd.get("cashValue")),
      productValueCents: cents(fd.get("productValue")),
      discountPct: num(fd.get("discountPct")),
      affiliateCommissionPct: num(fd.get("affiliateCommissionPct")),
      contractStart: dt(fd.get("contractStart")),
      contractEnd: dt(fd.get("contractEnd")),
      renewalDate: dt(fd.get("renewalDate")),
      active: true,
      notes: str(fd.get("notes")),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/os/sponsors");
  return { ok: true };
}

export async function addDeliverableAction(_p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("sponsor:write");
  const title = String(fd.get("title") ?? "").trim();
  const sponsorId = String(fd.get("sponsorId") ?? "").trim();
  if (!title) return { error: "Title is required." };
  if (!sponsorId) return { error: "Pick a sponsor." };
  try {
    await createDeliverable(ctx, {
      sponsorId,
      title,
      type: String(fd.get("type") || "Social Post"),
      status: String(fd.get("status") || "Planned"),
      dueDate: dt(fd.get("dueDate")),
      completedDate: null,
      episodeId: str(fd.get("episodeId")),
      vehicleId: str(fd.get("vehicleId")),
      notes: str(fd.get("notes")),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/os/sponsors");
  revalidatePath("/os/calendar");
  revalidatePath("/os");
  return { ok: true };
}

export async function setDeliverableStatusAction(id: string, status: string): Promise<void> {
  const ctx = await requireAuthWithPermission("sponsor:write");
  await setDeliverableStatus(ctx, id, status);
  revalidatePath("/os/sponsors");
  revalidatePath("/os");
}
