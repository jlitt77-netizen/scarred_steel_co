"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconPlus } from "@/components/ui/icons";
import { DIGITAL_PRODUCT_TYPES, DIGITAL_PRODUCT_STATUSES, BUILD_PHASE_NAMES } from "@/lib/enums";
import { addDigitalProductAction, addBlueprintSectionAction, type FormResult } from "./actions";

type Vehicle = { id: string; label: string };
type Opt = { id: string; name: string };

export function AddDigitalProductButton({ vehicles }: { vehicles: Vehicle[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult, FormData>(addDigitalProductAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { ref.current?.reset(); setOpen(false); } }, [state.ok]);
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}><IconPlus /> Product</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Digital Product">
        <form ref={ref} action={action} className="space-y-3">
          <div><label className="label" htmlFor="d-name">Name</label><input id="d-name" name="name" className="input" required placeholder="F-150 Complete Build Guide" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="d-type">Type</label>
              <select id="d-type" name="type" className="select" defaultValue="Build Blueprint">{DIGITAL_PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
            </div>
            <div>
              <label className="label" htmlFor="d-status">Status</label>
              <select id="d-status" name="status" className="select" defaultValue="Draft">{DIGITAL_PRODUCT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div><label className="label" htmlFor="d-price">Price ($, blank = free)</label><input id="d-price" name="price" className="input" inputMode="decimal" /></div>
            <div>
              <label className="label" htmlFor="d-vehicle">Build</label>
              <select id="d-vehicle" name="vehicleId" className="select" defaultValue="">
                <option value="">—</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
            <div><label className="label" htmlFor="d-sales">Sales count</label><input id="d-sales" name="salesCount" type="number" className="input" defaultValue={0} /></div>
            <div><label className="label" htmlFor="d-rev">Revenue ($)</label><input id="d-rev" name="revenue" className="input" inputMode="decimal" /></div>
            <div className="col-span-2"><label className="label" htmlFor="d-desc">Description</label><input id="d-desc" name="description" className="input" /></div>
          </div>
          {state.error && <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{state.error}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button></div>
        </form>
      </Modal>
    </>
  );
}

export function AddSectionButton({ vehicles, products }: { vehicles: Vehicle[]; products: Opt[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult, FormData>(addBlueprintSectionAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { ref.current?.reset(); setOpen(false); } }, [state.ok]);
  return (
    <>
      <button className="btn-secondary" onClick={() => setOpen(true)}><IconPlus /> Blueprint Section</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Capture Blueprint Section">
        <form ref={ref} action={action} className="space-y-3">
          <p className="text-xs text-paper-muted">Captured during the build — the source of truth for the Blueprint and Complete Build Guide.</p>
          <div><label className="label" htmlFor="b-title">Title</label><input id="b-title" name="title" className="input" required placeholder="Front suspension: coilover + drop spindle spec" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="b-phase">Build phase</label>
              <select id="b-phase" name="phaseName" className="select" defaultValue="">
                <option value="">—</option>
                {BUILD_PHASE_NAMES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="b-vehicle">Build</label>
              <select id="b-vehicle" name="vehicleId" className="select" defaultValue="">
                <option value="">—</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="b-product">Digital product</label>
              <select id="b-product" name="digitalProductId" className="select" defaultValue="">
                <option value="">—</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div><label className="label" htmlFor="b-seq">Order</label><input id="b-seq" name="sequence" type="number" className="input" defaultValue={0} /></div>
            <div><label className="label" htmlFor="b-captured">Captured date</label><input id="b-captured" name="capturedDate" type="date" className="input" /></div>
            <div className="col-span-2"><label className="label" htmlFor="b-content">Notes / content</label><input id="b-content" name="content" className="input" /></div>
          </div>
          {state.error && <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{state.error}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button></div>
        </form>
      </Modal>
    </>
  );
}
