"use server";

import { revalidatePath } from "next/cache";
import { requireAuthWithPermission } from "@/lib/auth";
import { createDigitalProduct, createBlueprintSection } from "@/server/services/commerce";
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
const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};
const dt = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : new Date(s);
};

export async function addDigitalProductAction(_p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("commerce:write");
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };
  try {
    await createDigitalProduct(ctx, {
      name,
      type: String(fd.get("type") || "Build Blueprint"),
      status: String(fd.get("status") || "Draft"),
      vehicleId: str(fd.get("vehicleId")),
      priceCents: cents(fd.get("price")),
      salesCount: int0(fd.get("salesCount")),
      revenueCents: cents(fd.get("revenue")) ?? 0,
      description: str(fd.get("description")),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/os/digital");
  return { ok: true };
}

export async function addBlueprintSectionAction(_p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("commerce:write");
  const title = String(fd.get("title") ?? "").trim();
  if (!title) return { error: "Title is required." };
  try {
    await createBlueprintSection(ctx, {
      title,
      digitalProductId: str(fd.get("digitalProductId")),
      vehicleId: str(fd.get("vehicleId")),
      phaseName: str(fd.get("phaseName")),
      sequence: int0(fd.get("sequence")),
      content: str(fd.get("content")),
      capturedDate: dt(fd.get("capturedDate")),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/os/digital");
  return { ok: true };
}
