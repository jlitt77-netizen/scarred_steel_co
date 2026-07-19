"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconPlus } from "@/components/ui/icons";
import {
  SPONSOR_STAGES, SPONSOR_LEVELS, DELIVERABLE_TYPES, DELIVERABLE_STATUSES,
} from "@/lib/enums";
import { addSponsorAction, addDeliverableAction, setDeliverableStatusAction, type FormResult } from "./actions";

type Opt = { id: string; name: string };

export function AddSponsorButton() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult, FormData>(addSponsorAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { ref.current?.reset(); setOpen(false); } }, [state.ok]);
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}><IconPlus /> Sponsor</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Sponsor">
        <form ref={ref} action={action} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label" htmlFor="s-name">Company</label><input id="s-name" name="name" className="input" required placeholder="Summit Racing" /></div>
            <div><label className="label" htmlFor="s-contact">Contact</label><input id="s-contact" name="contactName" className="input" /></div>
            <div><label className="label" htmlFor="s-email">Email</label><input id="s-email" name="email" type="email" className="input" /></div>
            <div>
              <label className="label" htmlFor="s-stage">Stage</label>
              <select id="s-stage" name="stage" className="select" defaultValue="Prospect">{SPONSOR_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div>
              <label className="label" htmlFor="s-level">Level</label>
              <select id="s-level" name="level" className="select" defaultValue="">
                <option value="">—</option>
                {SPONSOR_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div><label className="label" htmlFor="s-cash">Cash value / yr ($)</label><input id="s-cash" name="cashValue" className="input" inputMode="decimal" /></div>
            <div><label className="label" htmlFor="s-product">Product value / yr ($)</label><input id="s-product" name="productValue" className="input" inputMode="decimal" /></div>
            <div><label className="label" htmlFor="s-disc">Discount (%)</label><input id="s-disc" name="discountPct" type="number" className="input" /></div>
            <div><label className="label" htmlFor="s-aff">Affiliate commission (%)</label><input id="s-aff" name="affiliateCommissionPct" type="number" className="input" /></div>
            <div><label className="label" htmlFor="s-cstart">Contract start</label><input id="s-cstart" name="contractStart" type="date" className="input" /></div>
            <div><label className="label" htmlFor="s-cend">Contract end</label><input id="s-cend" name="contractEnd" type="date" className="input" /></div>
            <div><label className="label" htmlFor="s-renew">Renewal date</label><input id="s-renew" name="renewalDate" type="date" className="input" /></div>
            <div><label className="label" htmlFor="s-excat">Exclusive category</label><input id="s-excat" name="exclusiveCategory" className="input" placeholder="e.g. coilovers" /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-paper-steel"><input type="checkbox" name="exclusive" className="h-4 w-4" /> Category-exclusive partner</label>
          {state.error && <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{state.error}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button></div>
        </form>
      </Modal>
    </>
  );
}

export function AddDeliverableButton({ sponsors, episodes }: { sponsors: Opt[]; episodes: Opt[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult, FormData>(addDeliverableAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { ref.current?.reset(); setOpen(false); } }, [state.ok]);
  return (
    <>
      <button className="btn-secondary" onClick={() => setOpen(true)}><IconPlus /> Deliverable</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Deliverable">
        <form ref={ref} action={action} className="space-y-3">
          <div><label className="label" htmlFor="d-title">Title</label><input id="d-title" name="title" className="input" required placeholder="Coilover install feature in Ep. 2" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="d-sponsor">Sponsor</label>
              <select id="d-sponsor" name="sponsorId" className="select" defaultValue="" required>
                <option value="">— pick —</option>
                {sponsors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="d-type">Type</label>
              <select id="d-type" name="type" className="select" defaultValue="Social Post">{DELIVERABLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
            </div>
            <div>
              <label className="label" htmlFor="d-status">Status</label>
              <select id="d-status" name="status" className="select" defaultValue="Planned">{DELIVERABLE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div><label className="label" htmlFor="d-due">Due date</label><input id="d-due" name="dueDate" type="date" className="input" /></div>
            <div className="col-span-2">
              <label className="label" htmlFor="d-episode">Linked episode</label>
              <select id="d-episode" name="episodeId" className="select" defaultValue="">
                <option value="">—</option>
                {episodes.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-paper-muted">Due dates appear on the Master Calendar and the CEO dashboard.</p>
          {state.error && <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{state.error}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button></div>
        </form>
      </Modal>
    </>
  );
}

/** Inline status advancer on each deliverable row. */
export function DeliverableStatusSelect({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      className="select h-7 py-0 text-xs"
      defaultValue={status}
      disabled={pending}
      onChange={(e) => start(() => setDeliverableStatusAction(id, e.target.value))}
    >
      {DELIVERABLE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}
