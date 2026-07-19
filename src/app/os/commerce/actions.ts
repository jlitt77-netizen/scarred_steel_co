"use server";

import { revalidatePath } from "next/cache";
import { requireAuthWithPermission } from "@/lib/auth";
import { createMerchProduct, createAffiliateProduct } from "@/server/services/commerce";
import { toCents } from "@/lib/money";

export interface FormResult { ok?: boolean; error?: string }

const num = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
const int0 = (v: FormDataEntryValue | null) => num(v) ?? 0;
const cents = (v: FormDataEntryValue | null) => {
  const n = num(v);
  return n == null ? null : toCents(n);
};
const cents0 = (v: FormDataEntryValue | null) => cents(v) ?? 0;
const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};
const dt = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : new Date(s);
};

export async function addMerchAction(_p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("commerce:write");
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };
  const isDrop = fd.get("isDrop") === "on";
  try {
    await createMerchProduct(ctx, {
      name,
      sku: str(fd.get("sku")),
      category: String(fd.get("category") || "Other"),
      status: String(fd.get("status") || "Active"),
      cogsCents: cents(fd.get("cogs")),
      retailCents: cents(fd.get("retail")),
      inventoryQty: int0(fd.get("inventoryQty")),
      reorderPoint: int0(fd.get("reorderPoint")),
      isDrop,
      dropDate: dt(fd.get("dropDate")),
      dropQuantity: num(fd.get("dropQuantity")),
      vehicleId: str(fd.get("vehicleId")),
      episodeId: null,
      sponsorId: null,
      active: true,
      notes: null,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/os/commerce");
  return { ok: true };
}

export async function addAffiliateAction(_p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("commerce:write");
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };
  try {
    await createAffiliateProduct(ctx, {
      name,
      url: str(fd.get("url")),
      vendor: str(fd.get("vendor")),
      vehicleId: str(fd.get("vehicleId")),
      episodeId: null,
      sponsorId: null,
      clicks: int0(fd.get("clicks")),
      conversions: int0(fd.get("conversions")),
      revenueCents: cents0(fd.get("revenue")),
      commissionPct: num(fd.get("commissionPct")),
      active: true,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/os/commerce");
  return { ok: true };
}
