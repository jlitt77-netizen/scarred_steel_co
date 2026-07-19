"use server";

import { revalidatePath } from "next/cache";
import { requireAuthWithPermission } from "@/lib/auth";
import { createSeries, createEpisode, addContentRevenue } from "@/server/services/media";
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

export async function addSeriesAction(_p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("media:write");
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };
  try {
    await createSeries(ctx, {
      name,
      vehicleId: str(fd.get("vehicleId")),
      description: str(fd.get("description")),
      status: String(fd.get("status") || "Planning"),
      primaryPlatform: str(fd.get("primaryPlatform")),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/os/media");
  return { ok: true };
}

export async function addEpisodeAction(_p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("media:write");
  const title = String(fd.get("title") ?? "").trim();
  if (!title) return { error: "Title is required." };
  try {
    await createEpisode(ctx, {
      title,
      seriesId: str(fd.get("seriesId")),
      vehicleId: str(fd.get("vehicleId")),
      projectId: str(fd.get("projectId")),
      number: num(fd.get("number")),
      concept: str(fd.get("concept")),
      stage: String(fd.get("stage") || "Concept"),
      filmDate: dt(fd.get("filmDate")),
      editDueDate: dt(fd.get("editDueDate")),
      plannedPublishDate: dt(fd.get("plannedPublishDate")),
      publishedDate: dt(fd.get("publishedDate")),
      runtimeMinutes: num(fd.get("runtimeMinutes")),
      productionCostCents: cents(fd.get("productionCost")),
      cameraMemberId: str(fd.get("cameraMemberId")),
      editorMemberId: str(fd.get("editorMemberId")),
      youtubeUrl: str(fd.get("youtubeUrl")),
      notes: str(fd.get("notes")),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/os/media");
  revalidatePath("/os/calendar");
  return { ok: true };
}

export async function addRevenueAction(_p: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await requireAuthWithPermission("media:write");
  const amount = cents(fd.get("amount"));
  if (amount == null) return { error: "Amount is required." };
  try {
    await addContentRevenue(ctx, {
      episodeId: str(fd.get("episodeId")),
      vehicleId: str(fd.get("vehicleId")),
      source: String(fd.get("source") || "Ad"),
      amountCents: amount,
      date: dt(fd.get("date")),
      description: str(fd.get("description")),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/os/media");
  return { ok: true };
}
