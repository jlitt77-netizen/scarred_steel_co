"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconPlus } from "@/components/ui/icons";
import {
  RISK_CATEGORIES, RISK_RESPONSES, RISK_SEVERITIES, RISK_LIKELIHOODS, RISK_STATUSES,
} from "@/lib/enums";
import { addRiskAction, setRiskStatusAction, type FormResult } from "./actions";

export function AddRiskButton() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult, FormData>(addRiskAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { ref.current?.reset(); setOpen(false); } }, [state.ok]);
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}><IconPlus /> Risk</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Log a Risk">
        <form ref={ref} action={action} className="space-y-3">
          <div><label className="label" htmlFor="rk-title">Title</label><input id="rk-title" name="title" className="input" required placeholder="Coilover kit backordered 6 weeks" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="rk-cat">Category</label>
              <select id="rk-cat" name="category" className="select" defaultValue="Parts Delay">{RISK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            </div>
            <div>
              <label className="label" htmlFor="rk-resp">Response</label>
              <select id="rk-resp" name="responseOption" className="select" defaultValue="">
                <option value="">—</option>
                {RISK_RESPONSES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="rk-sev">Severity</label>
              <select id="rk-sev" name="severity" className="select" defaultValue="medium">{RISK_SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div>
              <label className="label" htmlFor="rk-like">Likelihood</label>
              <select id="rk-like" name="likelihood" className="select" defaultValue="medium">{RISK_LIKELIHOODS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            </div>
          </div>
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-paper-muted">Impact preview (if response taken)</div>
            <div className="grid grid-cols-4 gap-3">
              <div><label className="label" htmlFor="rk-sch">Schedule (days)</label><input id="rk-sch" name="scheduleImpactDays" type="number" className="input" /></div>
              <div><label className="label" htmlFor="rk-cost">Cost ($)</label><input id="rk-cost" name="costImpact" className="input" inputMode="decimal" /></div>
              <div><label className="label" htmlFor="rk-rev">Revenue ($)</label><input id="rk-rev" name="revenueImpact" className="input" inputMode="decimal" /></div>
              <div><label className="label" htmlFor="rk-cash">Cash ($)</label><input id="rk-cash" name="cashImpact" className="input" inputMode="decimal" /></div>
            </div>
          </div>
          <div><label className="label" htmlFor="rk-desc">Description</label><input id="rk-desc" name="description" className="input" /></div>
          {state.error && <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{state.error}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button></div>
        </form>
      </Modal>
    </>
  );
}

export function RiskStatusSelect({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <select className="select h-7 py-0 text-xs" defaultValue={status} disabled={pending} onChange={(e) => start(() => setRiskStatusAction(id, e.target.value))}>
      {RISK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}
