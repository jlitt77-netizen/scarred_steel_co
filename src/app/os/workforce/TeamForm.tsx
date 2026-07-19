"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconPlus } from "@/components/ui/icons";
import { TEAM_ROLES, ENGAGEMENT_TYPES } from "@/lib/enums";
import { addTeamMemberAction, type FormResult } from "./actions";

export function AddTeamMemberButton() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult, FormData>(addTeamMemberAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { ref.current?.reset(); setOpen(false); } }, [state.ok]);

  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}><IconPlus /> Team Member</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Team Member">
        <form ref={ref} action={action} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="name">Name</label><input id="name" name="name" className="input" required placeholder="Full name" /></div>
            <div><label className="label" htmlFor="relationship">Relationship</label><input id="relationship" name="relationship" className="input" placeholder="e.g. Father-in-law" /></div>
            <div>
              <label className="label" htmlFor="role">Role</label>
              <select id="role" name="role" className="select" defaultValue="Other">{TEAM_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
            </div>
            <div>
              <label className="label" htmlFor="engagementType">Engagement</label>
              <select id="engagementType" name="engagementType" className="select" defaultValue="contractor">{ENGAGEMENT_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}</select>
            </div>
            <div><label className="label" htmlFor="capacityHoursPerWeek">Capacity (hrs/wk)</label><input id="capacityHoursPerWeek" name="capacityHoursPerWeek" type="number" step="1" className="input" /></div>
            <div><label className="label" htmlFor="hourlyRate">Hourly rate ($)</label><input id="hourlyRate" name="hourlyRate" className="input" inputMode="decimal" /></div>
            <div><label className="label" htmlFor="salary">Salary — annual ($)</label><input id="salary" name="salary" className="input" inputMode="decimal" /></div>
            <div><label className="label" htmlFor="benefits">Benefits — annual ($)</label><input id="benefits" name="benefits" className="input" inputMode="decimal" /></div>
            <div><label className="label" htmlFor="payrollBurdenPct">Payroll burden (%)</label><input id="payrollBurdenPct" name="payrollBurdenPct" type="number" step="1" className="input" /></div>
            <div><label className="label" htmlFor="bonus">Bonus — annual ($)</label><input id="bonus" name="bonus" className="input" inputMode="decimal" /></div>
          </div>
          <p className="text-xs text-paper-muted">Compensation amounts are confidential — visible only to finance roles.</p>
          {state.error && <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{state.error}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button></div>
        </form>
      </Modal>
    </>
  );
}
