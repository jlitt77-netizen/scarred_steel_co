"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconPlus } from "@/components/ui/icons";
import { RESCUE_STAGES, RESCUE_OUTCOMES } from "@/lib/enums";
import { addRescueAction, setRescueStageAction, type FormResult } from "./actions";

export function AddRescueButton() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult, FormData>(addRescueAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { ref.current?.reset(); setOpen(false); } }, [state.ok]);
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}><IconPlus /> Rescue</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Log a Rescue">
        <form ref={ref} action={action} className="space-y-3">
          <div><label className="label" htmlFor="r-title">Title</label><input id="r-title" name="title" className="input" required placeholder="Barn-find C10 rescue" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="r-desc">Vehicle</label><input id="r-desc" name="vehicleDesc" className="input" /></div>
            <div><label className="label" htmlFor="r-loc">Location</label><input id="r-loc" name="location" className="input" /></div>
            <div>
              <label className="label" htmlFor="r-stage">Stage</label>
              <select id="r-stage" name="stage" className="select" defaultValue="Find">{RESCUE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div>
              <label className="label" htmlFor="r-outcome">Outcome</label>
              <select id="r-outcome" name="outcome" className="select" defaultValue="">
                <option value="">— undecided —</option>
                {RESCUE_OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className="label" htmlFor="r-notes">Notes</label><input id="r-notes" name="notes" className="input" /></div>
          </div>
          {state.error && <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{state.error}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button></div>
        </form>
      </Modal>
    </>
  );
}

export function RescueStageSelect({ id, stage }: { id: string; stage: string }) {
  const [pending, start] = useTransition();
  return (
    <select className="select h-7 py-0 text-xs" defaultValue={stage} disabled={pending} onChange={(e) => start(() => setRescueStageAction(id, e.target.value))}>
      {RESCUE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}
