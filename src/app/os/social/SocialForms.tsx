"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconPlus } from "@/components/ui/icons";
import { SOCIAL_PLATFORMS, SOCIAL_POST_KINDS, SOCIAL_POST_STATUSES } from "@/lib/enums";
import { addPostAction, generatePostSetAction, type FormResult } from "./actions";

type Opt = { id: string; name: string };
type Vehicle = { id: string; label: string };

export function AddPostButton({ episodes, vehicles }: { episodes: Opt[]; vehicles: Vehicle[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult, FormData>(addPostAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { ref.current?.reset(); setOpen(false); } }, [state.ok]);
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}><IconPlus /> Post</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Social Post">
        <form ref={ref} action={action} className="space-y-3">
          <div><label className="label" htmlFor="p-title">Title</label><input id="p-title" name="title" className="input" required placeholder="Suspension Day — Teaser" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="p-platform">Platform</label>
              <select id="p-platform" name="platform" className="select" defaultValue="YouTube">{SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}</select>
            </div>
            <div>
              <label className="label" htmlFor="p-kind">Kind</label>
              <select id="p-kind" name="kind" className="select" defaultValue="Post">{SOCIAL_POST_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select>
            </div>
            <div>
              <label className="label" htmlFor="p-status">Status</label>
              <select id="p-status" name="status" className="select" defaultValue="Idea">{SOCIAL_POST_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div>
              <label className="label" htmlFor="p-episode">Episode</label>
              <select id="p-episode" name="episodeId" className="select" defaultValue="">
                <option value="">—</option>
                {episodes.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="p-vehicle">Vehicle</label>
              <select id="p-vehicle" name="vehicleId" className="select" defaultValue="">
                <option value="">—</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
            <div><label className="label" htmlFor="p-sched">Scheduled</label><input id="p-sched" name="scheduledDate" type="date" className="input" /></div>
            <div><label className="label" htmlFor="p-pub">Published</label><input id="p-pub" name="publishedDate" type="date" className="input" /></div>
            <div className="col-span-2"><label className="label" htmlFor="p-cap">Caption</label><input id="p-cap" name="caption" className="input" /></div>
          </div>
          <p className="text-xs text-paper-muted">Scheduled and published posts appear on the Master Calendar.</p>
          {state.error && <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{state.error}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button></div>
        </form>
      </Modal>
    </>
  );
}

export function GeneratePostSetButton({ episodes }: { episodes: Opt[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult, FormData>(generatePostSetAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok && !state.message) { ref.current?.reset(); setOpen(false); } }, [state.ok, state.message]);
  return (
    <>
      <button className="btn-secondary" onClick={() => setOpen(true)}>Generate post set</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Generate Post Set from Episode">
        <form ref={ref} action={action} className="space-y-3">
          <p className="text-sm text-paper-muted">
            Spawns the standard multi-platform set — full episode, teaser, Shorts / Reels / TikTok, carousel,
            Facebook, and an email drop — all as <span className="text-paper-steel">Idea</span> posts. Re-running skips ones that already exist.
          </p>
          <div>
            <label className="label" htmlFor="g-episode">Episode</label>
            <select id="g-episode" name="episodeId" className="select" defaultValue="" required>
              <option value="">— pick an episode —</option>
              {episodes.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          {state.error && <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{state.error}</p>}
          {state.ok && state.message && <p className="rounded border border-status-healthy/50 bg-status-healthy/10 px-3 py-2 text-sm text-status-healthy">{state.message}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Close</button>
            <button type="submit" className="btn" disabled={pending}>{pending ? "Generating…" : "Generate"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
