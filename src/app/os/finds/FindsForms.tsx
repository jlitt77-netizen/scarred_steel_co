"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconPlus } from "@/components/ui/icons";
import { FIND_STAGES, FIND_VALUE_PATHS } from "@/lib/enums";
import { addFindAction, setFindStageAction, type FormResult } from "./actions";

export function AddFindButton() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult, FormData>(addFindAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { ref.current?.reset(); setOpen(false); } }, [state.ok]);
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}><IconPlus /> Find</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Log a Find">
        <form ref={ref} action={action} className="space-y-3">
          <div><label className="label" htmlFor="f-desc">Vehicle</label><input id="f-desc" name="vehicleDesc" className="input" required placeholder="1979 Ford F-150 Ranger" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="f-loc">Location</label><input id="f-loc" name="location" className="input" /></div>
            <div><label className="label" htmlFor="f-price">Asking price ($)</label><input id="f-price" name="askingPrice" className="input" inputMode="decimal" /></div>
            <div>
              <label className="label" htmlFor="f-stage">Stage</label>
              <select id="f-stage" name="stage" className="select" defaultValue="New">{FIND_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div>
              <label className="label" htmlFor="f-path">Value path</label>
              <select id="f-path" name="valuePath" className="select" defaultValue="">
                <option value="">—</option>
                {FIND_VALUE_PATHS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="label" htmlFor="f-sub">Submitter</label><input id="f-sub" name="submitterName" className="input" /></div>
            <div><label className="label" htmlFor="f-email">Submitter email</label><input id="f-email" name="submitterEmail" type="email" className="input" /></div>
            <div className="col-span-2"><label className="label" htmlFor="f-photo">Photo URL</label><input id="f-photo" name="photoUrl" className="input" /></div>
          </div>
          {state.error && <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{state.error}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button></div>
        </form>
      </Modal>
    </>
  );
}

export function FindStageSelect({ id, stage }: { id: string; stage: string }) {
  const [pending, start] = useTransition();
  return (
    <select className="select h-7 py-0 text-xs" defaultValue={stage} disabled={pending} onChange={(e) => start(() => setFindStageAction(id, e.target.value))}>
      {FIND_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}
