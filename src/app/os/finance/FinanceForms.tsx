"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconPlus } from "@/components/ui/icons";
import { RECEIVABLE_TYPES, PAYABLE_CATEGORIES, SEGMENTS } from "@/lib/enums";
import { addReceivableAction, addPayableAction, type FormResult } from "./actions";

function useAddForm(action: (p: FormResult, fd: FormData) => Promise<FormResult>) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FormResult, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { ref.current?.reset(); setOpen(false); } }, [state.ok]);
  return { open, setOpen, state, formAction, pending, ref };
}
function Err({ state }: { state: FormResult }) {
  return state.error ? <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{state.error}</p> : null;
}
function SegmentSelect() {
  return (
    <div>
      <label className="label" htmlFor="segment">Segment</label>
      <select id="segment" name="segment" className="select" defaultValue="Other">{SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
    </div>
  );
}

export function AddReceivableButton() {
  const f = useAddForm(addReceivableAction);
  return (
    <>
      <button className="btn-secondary" onClick={() => f.setOpen(true)}><IconPlus /> Receivable</button>
      <Modal open={f.open} onClose={() => f.setOpen(false)} title="Add Receivable (A/R)">
        <form ref={f.ref} action={f.formAction} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="type">Type</label>
              <select id="type" name="type" className="select">{RECEIVABLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
            </div>
            <SegmentSelect />
          </div>
          <div><label className="label" htmlFor="description">Description</label><input id="description" name="description" className="input" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="amount">Amount ($)</label><input id="amount" name="amount" className="input" inputMode="decimal" required /></div>
            <div><label className="label" htmlFor="dueDate">Due date</label><input id="dueDate" name="dueDate" type="date" className="input" /></div>
          </div>
          <Err state={f.state} />
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => f.setOpen(false)}>Cancel</button><button type="submit" className="btn" disabled={f.pending}>{f.pending ? "Saving…" : "Save"}</button></div>
        </form>
      </Modal>
    </>
  );
}

export function AddPayableButton() {
  const f = useAddForm(addPayableAction);
  return (
    <>
      <button className="btn-secondary" onClick={() => f.setOpen(true)}><IconPlus /> Payable</button>
      <Modal open={f.open} onClose={() => f.setOpen(false)} title="Add Payable (A/P)">
        <form ref={f.ref} action={f.formAction} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="category">Category</label>
              <select id="category" name="category" className="select">{PAYABLE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            </div>
            <SegmentSelect />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="vendor">Vendor</label><input id="vendor" name="vendor" className="input" /></div>
            <div><label className="label" htmlFor="amount">Amount ($)</label><input id="amount" name="amount" className="input" inputMode="decimal" required /></div>
          </div>
          <div><label className="label" htmlFor="description">Description</label><input id="description" name="description" className="input" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="dueDate">Due date</label><input id="dueDate" name="dueDate" type="date" className="input" /></div>
            <div><label className="label" htmlFor="scheduledCashDate">Scheduled cash date</label><input id="scheduledCashDate" name="scheduledCashDate" type="date" className="input" /></div>
          </div>
          <Err state={f.state} />
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => f.setOpen(false)}>Cancel</button><button type="submit" className="btn" disabled={f.pending}>{f.pending ? "Saving…" : "Save"}</button></div>
        </form>
      </Modal>
    </>
  );
}
