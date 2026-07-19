"use server";

import { revalidatePath } from "next/cache";
import { requireAuthWithPermission } from "@/lib/auth";
import { createVehicle } from "@/server/services/vehicles";
import { toCents } from "@/lib/money";
import { ZodError } from "zod";

export interface VehicleFormState {
  error?: string;
  ok?: boolean;
}

function dollarsFieldToCents(v: FormDataEntryValue | null): number | undefined {
  if (v == null || String(v).trim() === "") return undefined;
  const num = Number(String(v).replace(/[^0-9.\-]/g, ""));
  if (!Number.isFinite(num)) return undefined;
  return toCents(num);
}

export async function createVehicleAction(
  _prev: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  const ctx = await requireAuthWithPermission("vehicle:write");

  try {
    await createVehicle(ctx, {
      year: Number(formData.get("year")),
      make: String(formData.get("make") ?? "").trim(),
      model: String(formData.get("model") ?? "").trim(),
      trim: (String(formData.get("trim") ?? "").trim() || null) as string | null,
      nickname: (String(formData.get("nickname") ?? "").trim() || null) as
        | string
        | null,
      status: String(formData.get("status") ?? "Potential Purchase") as never,
      acquisitionCostCents: dollarsFieldToCents(formData.get("acquisitionCost")),
      buildBudgetCents: dollarsFieldToCents(formData.get("buildBudget")),
    } as never);
  } catch (err) {
    if (err instanceof ZodError) {
      return { error: err.issues.map((i) => i.message).join("; ") };
    }
    return { error: err instanceof Error ? err.message : "Failed to create vehicle." };
  }

  revalidatePath("/os/vehicles");
  return { ok: true };
}
