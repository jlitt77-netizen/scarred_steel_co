"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconPlus } from "@/components/ui/icons";
import {
  COST_CATEGORIES, COST_STATUSES, PARTS_STATUSES, DOCUMENT_CATEGORIES,
  ISSUE_SEVERITIES, ISSUE_STATUSES,
} from "@/lib/enums";
import {
  addCostItemAction, addPartAction, addDocumentAction, addPhotoAction, addIssueAction,
  type FormResult,
} from "./actions";

type PhaseOpt = { id: string; name: string };

function useAddForm(action: (p: FormResult, fd: FormData) => Promise<FormResult>) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FormResult, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) { ref.current?.reset(); setOpen(false); }
  }, [state.ok]);
  return { open, setOpen, state, formAction, pending, ref };
}

function PhaseSelect({ phases }: { phases: PhaseOpt[] }) {
  return (
    <div>
      <label className="label" htmlFor="phaseId">Phase (optional)</label>
      <select id="phaseId" name="phaseId" className="select" defaultValue="">
        <option value="">—</option>
        {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </div>
  );
}

function Err({ state }: { state: FormResult }) {
  if (!state.error) return null;
  return <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical" role="alert">{state.error}</p>;
}
function Actions({ pending, onCancel }: { pending: boolean; onCancel: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      <button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
    </div>
  );
}

export function AddCostButton({ projectId, vehicleId, phases }: { projectId: string; vehicleId: string; phases: PhaseOpt[] }) {
  const f = useAddForm(addCostItemAction.bind(null, vehicleId));
  return (
    <>
      <button className="btn" onClick={() => f.setOpen(true)}><IconPlus /> Add Cost</button>
      <Modal open={f.open} onClose={() => f.setOpen(false)} title="Add Cost Line Item">
        <form ref={f.ref} action={f.formAction} className="space-y-3">
          <input type="hidden" name="projectId" value={projectId} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="category">Category</label>
              <select id="category" name="category" className="select" required>
                {COST_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="status">Status</label>
              <select id="status" name="status" className="select" defaultValue="planned">
                {COST_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="description">Description</label>
            <input id="description" name="description" className="input" required placeholder="Front coilover conversion" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label" htmlFor="budget">Budget ($)</label><input id="budget" name="budget" className="input" inputMode="decimal" /></div>
            <div><label className="label" htmlFor="committed">Committed ($)</label><input id="committed" name="committed" className="input" inputMode="decimal" /></div>
            <div><label className="label" htmlFor="actual">Actual ($)</label><input id="actual" name="actual" className="input" inputMode="decimal" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="vendor">Vendor</label><input id="vendor" name="vendor" className="input" /></div>
            <PhaseSelect phases={phases} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="scheduledCashDate">Scheduled cash date</label><input id="scheduledCashDate" name="scheduledCashDate" type="date" className="input" /></div>
            <div><label className="label" htmlFor="paidDate">Paid date</label><input id="paidDate" name="paidDate" type="date" className="input" /></div>
          </div>
          <Err state={f.state} />
          <Actions pending={f.pending} onCancel={() => f.setOpen(false)} />
        </form>
      </Modal>
    </>
  );
}

export function AddPartButton({ projectId, vehicleId, phases }: { projectId: string; vehicleId: string; phases: PhaseOpt[] }) {
  const f = useAddForm(addPartAction.bind(null, vehicleId));
  return (
    <>
      <button className="btn" onClick={() => f.setOpen(true)}><IconPlus /> Add Part</button>
      <Modal open={f.open} onClose={() => f.setOpen(false)} title="Add Parts Order">
        <form ref={f.ref} action={f.formAction} className="space-y-3">
          <input type="hidden" name="projectId" value={projectId} />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="partName">Part name</label><input id="partName" name="partName" className="input" required /></div>
            <div><label className="label" htmlFor="manufacturer">Manufacturer</label><input id="manufacturer" name="manufacturer" className="input" /></div>
            <div><label className="label" htmlFor="partNumber">Part number</label><input id="partNumber" name="partNumber" className="input" /></div>
            <div><label className="label" htmlFor="quantity">Quantity</label><input id="quantity" name="quantity" type="number" min={1} defaultValue={1} className="input" /></div>
            <div><label className="label" htmlFor="unitCost">Unit cost ($)</label><input id="unitCost" name="unitCost" className="input" inputMode="decimal" /></div>
            <div>
              <label className="label" htmlFor="status">Status</label>
              <select id="status" name="status" className="select" defaultValue="needed">{PARTS_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div><label className="label" htmlFor="vendor">Vendor</label><input id="vendor" name="vendor" className="input" /></div>
            <div><label className="label" htmlFor="expectedAt">Expected date</label><input id="expectedAt" name="expectedAt" type="date" className="input" /></div>
          </div>
          <div><label className="label" htmlFor="affiliateUrl">Affiliate / product URL</label><input id="affiliateUrl" name="affiliateUrl" className="input" placeholder="https://" /></div>
          <PhaseSelect phases={phases} />
          <Err state={f.state} />
          <Actions pending={f.pending} onCancel={() => f.setOpen(false)} />
        </form>
      </Modal>
    </>
  );
}

export function AddDocumentButton({ vehicleId, projectId }: { vehicleId: string; projectId: string }) {
  const f = useAddForm(addDocumentAction.bind(null, vehicleId));
  return (
    <>
      <button className="btn" onClick={() => f.setOpen(true)}><IconPlus /> Add Document</button>
      <Modal open={f.open} onClose={() => f.setOpen(false)} title="Add Document">
        <form ref={f.ref} action={f.formAction} className="space-y-3">
          <input type="hidden" name="projectId" value={projectId} />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="name">Name</label><input id="name" name="name" className="input" required /></div>
            <div>
              <label className="label" htmlFor="category">Category</label>
              <select id="category" name="category" className="select" defaultValue="Other">{DOCUMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            </div>
          </div>
          <div><label className="label" htmlFor="url">URL (optional)</label><input id="url" name="url" className="input" placeholder="https://" /></div>
          <div><label className="label" htmlFor="notes">Notes</label><input id="notes" name="notes" className="input" /></div>
          <Err state={f.state} />
          <Actions pending={f.pending} onCancel={() => f.setOpen(false)} />
        </form>
      </Modal>
    </>
  );
}

export function AddPhotoButton({ vehicleId, projectId }: { vehicleId: string; projectId: string }) {
  const f = useAddForm(addPhotoAction.bind(null, vehicleId));
  return (
    <>
      <button className="btn" onClick={() => f.setOpen(true)}><IconPlus /> Add Photo</button>
      <Modal open={f.open} onClose={() => f.setOpen(false)} title="Add Photo (URL)">
        <form ref={f.ref} action={f.formAction} className="space-y-3">
          <input type="hidden" name="projectId" value={projectId} />
          <div><label className="label" htmlFor="url">Image URL</label><input id="url" name="url" className="input" required placeholder="https://…/photo.jpg" /></div>
          <div><label className="label" htmlFor="caption">Caption</label><input id="caption" name="caption" className="input" /></div>
          <p className="text-xs text-paper-muted">Direct file upload (Supabase Storage) arrives in a later pass; for now paste an image URL.</p>
          <Err state={f.state} />
          <Actions pending={f.pending} onCancel={() => f.setOpen(false)} />
        </form>
      </Modal>
    </>
  );
}

export function AddIssueButton({ projectId, vehicleId }: { projectId: string; vehicleId: string }) {
  const f = useAddForm(addIssueAction.bind(null, vehicleId));
  return (
    <>
      <button className="btn" onClick={() => f.setOpen(true)}><IconPlus /> Add Issue</button>
      <Modal open={f.open} onClose={() => f.setOpen(false)} title="Log Issue">
        <form ref={f.ref} action={f.formAction} className="space-y-3">
          <input type="hidden" name="projectId" value={projectId} />
          <div><label className="label" htmlFor="title">Title</label><input id="title" name="title" className="input" required /></div>
          <div><label className="label" htmlFor="description">Description</label><textarea id="description" name="description" className="input" rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="severity">Severity</label><select id="severity" name="severity" className="select" defaultValue="medium">{ISSUE_SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="label" htmlFor="status">Status</label><select id="status" name="status" className="select" defaultValue="open">{ISSUE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <Err state={f.state} />
          <Actions pending={f.pending} onCancel={() => f.setOpen(false)} />
        </form>
      </Modal>
    </>
  );
}
