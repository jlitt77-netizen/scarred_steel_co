"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconPlus } from "@/components/ui/icons";
import { WORK_ORDER_TYPES, WORK_ORDER_STATUSES } from "@/lib/enums";
import { addWorkOrderAction, type FormResult } from "./actions";

export function AddWorkOrderButton({
  shops, projects,
}: {
  shops: { id: string; name: string }[];
  projects: { id: string; name: string; vehicleId: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult, FormData>(addWorkOrderAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { ref.current?.reset(); setOpen(false); } }, [state.ok]);

  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}><IconPlus /> Work Order</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Work Order">
        <form ref={ref} action={action} className="space-y-3">
          <div><label className="label" htmlFor="title">Title</label><input id="title" name="title" className="input" required placeholder="F-150 suspension fab + install" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="partnerShopId">Partner shop</label>
              <select id="partnerShopId" name="partnerShopId" className="select" defaultValue={shops[0]?.id ?? ""}>
                <option value="">—</option>
                {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="projectId">Project</label>
              <select id="projectId" name="projectId" className="select" defaultValue="">
                <option value="">—</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="type">Type</label>
              <select id="type" name="type" className="select" defaultValue="hourly">{WORK_ORDER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
            </div>
            <div>
              <label className="label" htmlFor="status">Status</label>
              <select id="status" name="status" className="select" defaultValue="draft">{WORK_ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div><label className="label" htmlFor="estimatedHours">Estimated hours</label><input id="estimatedHours" name="estimatedHours" type="number" step="0.5" className="input" /></div>
            <div><label className="label" htmlFor="actualHours">Actual hours</label><input id="actualHours" name="actualHours" type="number" step="0.5" className="input" /></div>
            <div><label className="label" htmlFor="hourlyRate">Hourly rate ($)</label><input id="hourlyRate" name="hourlyRate" className="input" inputMode="decimal" placeholder="shop default" /></div>
            <div><label className="label" htmlFor="fixedPrice">Fixed price ($)</label><input id="fixedPrice" name="fixedPrice" className="input" inputMode="decimal" /></div>
            <div><label className="label" htmlFor="scheduledStart">Scheduled start</label><input id="scheduledStart" name="scheduledStart" type="date" className="input" /></div>
            <div><label className="label" htmlFor="scheduledEnd">Scheduled end</label><input id="scheduledEnd" name="scheduledEnd" type="date" className="input" /></div>
          </div>
          {state.error && <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{state.error}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button></div>
        </form>
      </Modal>
    </>
  );
}
