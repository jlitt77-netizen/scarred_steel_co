"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconPlus } from "@/components/ui/icons";
import { CONTENT_SERIES_STATUSES, EPISODE_STAGES, CONTENT_REVENUE_SOURCES } from "@/lib/enums";
import { addSeriesAction, addEpisodeAction, addRevenueAction, type FormResult } from "./actions";

type Vehicle = { id: string; label: string };
type Opt = { id: string; name: string };

function useCloseOnSuccess(state: FormResult, ref: React.RefObject<HTMLFormElement | null>, close: () => void) {
  useEffect(() => { if (state.ok) { ref.current?.reset(); close(); } }, [state.ok, ref, close]);
}

export function AddSeriesButton({ vehicles }: { vehicles: Vehicle[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult, FormData>(addSeriesAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useCloseOnSuccess(state, ref, () => setOpen(false));
  return (
    <>
      <button className="btn-secondary" onClick={() => setOpen(true)}><IconPlus /> Series</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Content Series">
        <form ref={ref} action={action} className="space-y-3">
          <div><label className="label" htmlFor="s-name">Name</label><input id="s-name" name="name" className="input" required placeholder="F-150 Patina Build" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="s-vehicle">Vehicle</label>
              <select id="s-vehicle" name="vehicleId" className="select" defaultValue="">
                <option value="">—</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="s-status">Status</label>
              <select id="s-status" name="status" className="select" defaultValue="Planning">{CONTENT_SERIES_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div><label className="label" htmlFor="s-platform">Primary platform</label><input id="s-platform" name="primaryPlatform" className="input" placeholder="YouTube" /></div>
            <div><label className="label" htmlFor="s-desc">Description</label><input id="s-desc" name="description" className="input" /></div>
          </div>
          {state.error && <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{state.error}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button></div>
        </form>
      </Modal>
    </>
  );
}

export function AddEpisodeButton({ vehicles, series }: { vehicles: Vehicle[]; series: Opt[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult, FormData>(addEpisodeAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useCloseOnSuccess(state, ref, () => setOpen(false));
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}><IconPlus /> Episode</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Episode">
        <form ref={ref} action={action} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label" htmlFor="e-title">Title</label><input id="e-title" name="title" className="input" required placeholder="Suspension Day" /></div>
            <div>
              <label className="label" htmlFor="e-series">Series</label>
              <select id="e-series" name="seriesId" className="select" defaultValue="">
                <option value="">—</option>
                {series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="e-vehicle">Vehicle</label>
              <select id="e-vehicle" name="vehicleId" className="select" defaultValue="">
                <option value="">—</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="e-stage">Stage</label>
              <select id="e-stage" name="stage" className="select" defaultValue="Concept">{EPISODE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div><label className="label" htmlFor="e-number">Episode #</label><input id="e-number" name="number" type="number" className="input" /></div>
            <div><label className="label" htmlFor="e-cost">Production cost ($)</label><input id="e-cost" name="productionCost" className="input" inputMode="decimal" /></div>
            <div><label className="label" htmlFor="e-runtime">Runtime (min)</label><input id="e-runtime" name="runtimeMinutes" type="number" className="input" /></div>
            <div><label className="label" htmlFor="e-film">Film date</label><input id="e-film" name="filmDate" type="date" className="input" /></div>
            <div><label className="label" htmlFor="e-edit">Edit due</label><input id="e-edit" name="editDueDate" type="date" className="input" /></div>
            <div><label className="label" htmlFor="e-plan">Planned publish</label><input id="e-plan" name="plannedPublishDate" type="date" className="input" /></div>
            <div><label className="label" htmlFor="e-pub">Published</label><input id="e-pub" name="publishedDate" type="date" className="input" /></div>
            <div className="col-span-2"><label className="label" htmlFor="e-concept">Concept</label><input id="e-concept" name="concept" className="input" /></div>
          </div>
          <p className="text-xs text-paper-muted">Film, edit-due, and publish dates flow onto the Master Calendar automatically.</p>
          {state.error && <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{state.error}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button></div>
        </form>
      </Modal>
    </>
  );
}

export function AddRevenueButton({ episodes }: { episodes: Opt[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult, FormData>(addRevenueAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useCloseOnSuccess(state, ref, () => setOpen(false));
  return (
    <>
      <button className="btn-secondary" onClick={() => setOpen(true)}><IconPlus /> Revenue</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Attribute Content Revenue">
        <form ref={ref} action={action} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label" htmlFor="r-episode">Episode</label>
              <select id="r-episode" name="episodeId" className="select" defaultValue="">
                <option value="">— (unattributed)</option>
                {episodes.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="r-source">Source</label>
              <select id="r-source" name="source" className="select" defaultValue="Ad">{CONTENT_REVENUE_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div><label className="label" htmlFor="r-amount">Amount ($)</label><input id="r-amount" name="amount" className="input" inputMode="decimal" required /></div>
            <div><label className="label" htmlFor="r-date">Date</label><input id="r-date" name="date" type="date" className="input" /></div>
            <div><label className="label" htmlFor="r-desc">Description</label><input id="r-desc" name="description" className="input" /></div>
          </div>
          {state.error && <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{state.error}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button></div>
        </form>
      </Modal>
    </>
  );
}
