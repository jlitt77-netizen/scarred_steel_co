"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconPlus } from "@/components/ui/icons";
import { saveAssessmentAction, type FormResult } from "./actions";

type Opt = { id: string; name: string };

export function AssessButton({ vehicles }: { vehicles: Opt[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult, FormData>(saveAssessmentAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { ref.current?.reset(); setOpen(false); } }, [state.ok]);
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}><IconPlus /> Assessment</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Keep-vs-Sell Assessment">
        <form ref={ref} action={action} className="space-y-3">
          <div>
            <label className="label" htmlFor="f-vehicle">Vehicle</label>
            <select id="f-vehicle" name="vehicleId" className="select" defaultValue="" required>
              <option value="">— pick —</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-paper-muted">Annual cost ($)</div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label" htmlFor="f-ins">Insurance</label><input id="f-ins" name="insurance" className="input" inputMode="decimal" /></div>
              <div><label className="label" htmlFor="f-stor">Storage</label><input id="f-stor" name="storage" className="input" inputMode="decimal" /></div>
              <div><label className="label" htmlFor="f-opp">Opportunity</label><input id="f-opp" name="opportunity" className="input" inputMode="decimal" /></div>
            </div>
          </div>
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-paper-muted">Annual value ($)</div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label" htmlFor="f-media">Media</label><input id="f-media" name="media" className="input" inputMode="decimal" /></div>
              <div><label className="label" htmlFor="f-spon">Sponsor</label><input id="f-spon" name="sponsor" className="input" inputMode="decimal" /></div>
              <div><label className="label" htmlFor="f-aff">Affiliate</label><input id="f-aff" name="affiliate" className="input" inputMode="decimal" /></div>
              <div><label className="label" htmlFor="f-merch">Merch</label><input id="f-merch" name="merch" className="input" inputMode="decimal" /></div>
              <div><label className="label" htmlFor="f-event">Event</label><input id="f-event" name="event" className="input" inputMode="decimal" /></div>
              <div><label className="label" htmlFor="f-brand">Brand</label><input id="f-brand" name="brand" className="input" inputMode="decimal" /></div>
            </div>
          </div>
          <p className="text-xs text-paper-muted">The KEEP / REVIEW / SELL recommendation is computed from these annual figures against cost.</p>
          {state.error && <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{state.error}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button></div>
        </form>
      </Modal>
    </>
  );
}
