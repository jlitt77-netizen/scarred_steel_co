"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconPlus } from "@/components/ui/icons";
import { GIVEAWAY_STAGES } from "@/lib/enums";
import { addGiveawayAction, toggleGateAction, launchGiveawayAction, type FormResult } from "./actions";

type Opt = { id: string; name: string };

export function AddGiveawayButton({ vehicles }: { vehicles: Opt[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult, FormData>(addGiveawayAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { ref.current?.reset(); setOpen(false); } }, [state.ok]);
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}><IconPlus /> Giveaway</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Plan a Giveaway">
        <form ref={ref} action={action} className="space-y-3">
          <div><label className="label" htmlFor="g-name">Name</label><input id="g-name" name="name" className="input" required placeholder="F-150 Patina King Giveaway" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label" htmlFor="g-prize">Prize</label><input id="g-prize" name="prizeDescription" className="input" placeholder="The finished 1979 F-150" /></div>
            <div><label className="label" htmlFor="g-value">Prize value ($)</label><input id="g-value" name="prizeValue" className="input" inputMode="decimal" /></div>
            <div>
              <label className="label" htmlFor="g-vehicle">Vehicle</label>
              <select id="g-vehicle" name="vehicleId" className="select" defaultValue="">
                <option value="">—</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="g-stage">Stage</label>
              <select id="g-stage" name="stage" className="select" defaultValue="Concept">{GIVEAWAY_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div><label className="label" htmlFor="g-launch">Launch date</label><input id="g-launch" name="launchDate" type="date" className="input" /></div>
            <div><label className="label" htmlFor="g-end">End date</label><input id="g-end" name="endDate" type="date" className="input" /></div>
            <div><label className="label" htmlFor="g-draw">Draw date</label><input id="g-draw" name="drawDate" type="date" className="input" /></div>
          </div>
          <p className="text-xs text-paper-muted">Dates flow onto the Master Calendar. The giveaway stays LAUNCH BLOCKED until every compliance gate passes.</p>
          {state.error && <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{state.error}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button></div>
        </form>
      </Modal>
    </>
  );
}

export function GateToggle({ id, gate, label, checked, disabled }: { id: string; gate: string; label: string; checked: boolean; disabled?: boolean }) {
  const [pending, start] = useTransition();
  return (
    <label className={`flex items-center gap-2 text-sm ${checked ? "text-status-healthy" : "text-paper-steel"}`}>
      <input
        type="checkbox"
        className="h-4 w-4"
        defaultChecked={checked}
        disabled={disabled || pending}
        onChange={(e) => start(() => toggleGateAction(id, gate, e.target.checked))}
      />
      {label}
    </label>
  );
}

export function LaunchButton({ id, ready }: { id: string; ready: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2">
      <button
        className={ready ? "btn" : "btn-secondary cursor-not-allowed opacity-60"}
        disabled={!ready || pending}
        onClick={() => start(async () => { const r = await launchGiveawayAction(id); setError(r.error ?? null); })}
      >
        {pending ? "Launching…" : ready ? "Launch" : "LAUNCH BLOCKED"}
      </button>
      {error && <span className="text-xs text-status-critical">{error}</span>}
    </div>
  );
}
