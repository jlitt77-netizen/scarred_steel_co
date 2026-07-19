"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createVehicleAction, type VehicleFormState } from "./actions";
import { VEHICLE_STATUSES } from "@/lib/enums";

export function NewVehicleForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<VehicleFormState, FormData>(
    createVehicleAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state.ok]);

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        + Add Vehicle
      </button>
    );
  }

  return (
    <form ref={formRef} action={action} className="card w-full max-w-xl space-y-3">
      <h2 className="text-lg font-semibold text-steel-100">Add Vehicle</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="year">Year</label>
          <input id="year" name="year" type="number" className="input" required defaultValue={1979} />
        </div>
        <div>
          <label className="label" htmlFor="make">Make</label>
          <input id="make" name="make" className="input" required defaultValue="Ford" />
        </div>
        <div>
          <label className="label" htmlFor="model">Model</label>
          <input id="model" name="model" className="input" required placeholder="F-150" />
        </div>
        <div>
          <label className="label" htmlFor="trim">Trim</label>
          <input id="trim" name="trim" className="input" placeholder="Ranger XLT" />
        </div>
        <div>
          <label className="label" htmlFor="nickname">Nickname</label>
          <input id="nickname" name="nickname" className="input" placeholder="Highboy" />
        </div>
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select id="status" name="status" className="input" defaultValue="Potential Purchase">
            {VEHICLE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="acquisitionCost">Acquisition Cost ($)</label>
          <input id="acquisitionCost" name="acquisitionCost" className="input" inputMode="decimal" placeholder="8500" />
        </div>
        <div>
          <label className="label" htmlFor="buildBudget">Build Budget ($)</label>
          <input id="buildBudget" name="buildBudget" className="input" inputMode="decimal" placeholder="25000" />
        </div>
      </div>

      {state.error && (
        <p className="rounded-md border border-rust-600 bg-rust-600/10 px-3 py-2 text-sm text-rust-400">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Saving…" : "Save Vehicle"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
