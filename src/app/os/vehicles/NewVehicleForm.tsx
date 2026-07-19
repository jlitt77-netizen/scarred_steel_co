"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createVehicleAction, type VehicleFormState } from "./actions";
import { VEHICLE_STATUSES } from "@/lib/enums";
import { Modal } from "@/components/ui/Modal";
import { IconPlus } from "@/components/ui/icons";

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

  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}>
        <IconPlus /> Add Vehicle
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Vehicle">
        <form ref={formRef} action={action} className="space-y-4">
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
              <select id="status" name="status" className="select" defaultValue="Potential Purchase">
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
            <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical" role="alert">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn" disabled={pending}>
              {pending ? "Saving…" : "Save Vehicle"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
