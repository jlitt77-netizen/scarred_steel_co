"use server";

import { revalidatePath } from "next/cache";
import { requireAuthWithPermission } from "@/lib/auth";
import {
  createCostItem,
  createPartsOrder,
  createDocument,
  createPhoto,
  createIssue,
} from "@/server/services/build";
import { toCents } from "@/lib/money";
import { ZodError } from "zod";

export interface FormResult {
  ok?: boolean;
  error?: string;
}

function dollarsToCents(v: FormDataEntryValue | null): number | undefined {
  if (v == null || String(v).trim() === "") return undefined;
  const num = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(num) ? toCents(num) : undefined;
}
const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};
const date = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

function handle(fn: () => Promise<unknown>, path: string): Promise<FormResult> {
  return fn()
    .then(() => {
      revalidatePath(path);
      return { ok: true };
    })
    .catch((err) => {
      if (err instanceof ZodError) return { error: err.issues.map((i) => i.message).join("; ") };
      return { error: err instanceof Error ? err.message : "Failed." };
    });
}

export async function addCostItemAction(vehicleId: string, _p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("project:write");
  return handle(
    () =>
      createCostItem(ctx, {
        projectId: String(fd.get("projectId")),
        phaseId: str(fd.get("phaseId")),
        category: String(fd.get("category")),
        description: String(fd.get("description") ?? "").trim(),
        vendor: str(fd.get("vendor")),
        status: String(fd.get("status") || "planned"),
        budgetCents: dollarsToCents(fd.get("budget")),
        committedCents: dollarsToCents(fd.get("committed")),
        actualCents: dollarsToCents(fd.get("actual")),
        scheduledCashDate: date(fd.get("scheduledCashDate")),
        paidDate: date(fd.get("paidDate")),
        notes: str(fd.get("notes")),
      }),
    `/os/vehicles/${vehicleId}`,
  );
}

export async function addPartAction(vehicleId: string, _p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("project:write");
  return handle(
    () =>
      createPartsOrder(ctx, {
        projectId: String(fd.get("projectId")),
        phaseId: str(fd.get("phaseId")),
        manufacturer: str(fd.get("manufacturer")),
        partName: String(fd.get("partName") ?? "").trim(),
        partNumber: str(fd.get("partNumber")),
        quantity: Number(fd.get("quantity") || 1),
        unitCostCents: dollarsToCents(fd.get("unitCost")),
        status: String(fd.get("status") || "needed"),
        vendor: str(fd.get("vendor")),
        affiliateUrl: str(fd.get("affiliateUrl")) ?? "",
        expectedAt: date(fd.get("expectedAt")),
      }),
    `/os/vehicles/${vehicleId}`,
  );
}

export async function addDocumentAction(vehicleId: string, _p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("vehicle:write");
  return handle(
    () =>
      createDocument(ctx, {
        vehicleId,
        projectId: str(fd.get("projectId")),
        name: String(fd.get("name") ?? "").trim(),
        category: String(fd.get("category") || "Other"),
        url: str(fd.get("url")) ?? "",
        notes: str(fd.get("notes")),
      }),
    `/os/vehicles/${vehicleId}`,
  );
}

export async function addPhotoAction(vehicleId: string, _p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("vehicle:write");
  return handle(
    () =>
      createPhoto(ctx, {
        vehicleId,
        projectId: str(fd.get("projectId")),
        url: String(fd.get("url") ?? "").trim(),
        caption: str(fd.get("caption")),
      }),
    `/os/vehicles/${vehicleId}`,
  );
}

export async function addIssueAction(vehicleId: string, _p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("project:write");
  return handle(
    () =>
      createIssue(ctx, {
        projectId: String(fd.get("projectId")),
        title: String(fd.get("title") ?? "").trim(),
        description: str(fd.get("description")),
        severity: String(fd.get("severity") || "medium"),
        status: String(fd.get("status") || "open"),
      }),
    `/os/vehicles/${vehicleId}`,
  );
}
