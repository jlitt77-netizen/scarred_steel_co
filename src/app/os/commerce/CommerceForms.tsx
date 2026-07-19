"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconPlus } from "@/components/ui/icons";
import { MERCH_CATEGORIES, MERCH_STATUSES } from "@/lib/enums";
import { addMerchAction, addAffiliateAction, type FormResult } from "./actions";

type Vehicle = { id: string; label: string };

export function AddMerchButton({ vehicles }: { vehicles: Vehicle[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult, FormData>(addMerchAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { ref.current?.reset(); setOpen(false); } }, [state.ok]);
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}><IconPlus /> Merch</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Merch Product">
        <form ref={ref} action={action} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label" htmlFor="m-name">Name</label><input id="m-name" name="name" className="input" required placeholder="Patina King Tee" /></div>
            <div><label className="label" htmlFor="m-sku">SKU</label><input id="m-sku" name="sku" className="input" /></div>
            <div>
              <label className="label" htmlFor="m-cat">Category</label>
              <select id="m-cat" name="category" className="select" defaultValue="Apparel">{MERCH_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            </div>
            <div><label className="label" htmlFor="m-cogs">COGS ($)</label><input id="m-cogs" name="cogs" className="input" inputMode="decimal" /></div>
            <div><label className="label" htmlFor="m-retail">Retail ($)</label><input id="m-retail" name="retail" className="input" inputMode="decimal" /></div>
            <div><label className="label" htmlFor="m-qty">Inventory qty</label><input id="m-qty" name="inventoryQty" type="number" className="input" defaultValue={0} /></div>
            <div><label className="label" htmlFor="m-reorder">Reorder point</label><input id="m-reorder" name="reorderPoint" type="number" className="input" defaultValue={0} /></div>
            <div>
              <label className="label" htmlFor="m-status">Status</label>
              <select id="m-status" name="status" className="select" defaultValue="Active">{MERCH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div>
              <label className="label" htmlFor="m-vehicle">Build</label>
              <select id="m-vehicle" name="vehicleId" className="select" defaultValue="">
                <option value="">—</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
            <div><label className="label" htmlFor="m-drop">Drop date</label><input id="m-drop" name="dropDate" type="date" className="input" /></div>
            <div><label className="label" htmlFor="m-dropqty">Drop qty</label><input id="m-dropqty" name="dropQuantity" type="number" className="input" /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-paper-steel"><input type="checkbox" name="isDrop" className="h-4 w-4" /> Limited drop</label>
          {state.error && <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{state.error}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button></div>
        </form>
      </Modal>
    </>
  );
}

export function AddAffiliateButton({ vehicles }: { vehicles: Vehicle[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult, FormData>(addAffiliateAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { ref.current?.reset(); setOpen(false); } }, [state.ok]);
  return (
    <>
      <button className="btn-secondary" onClick={() => setOpen(true)}><IconPlus /> Affiliate</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Affiliate Product">
        <form ref={ref} action={action} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label" htmlFor="a-name">Product</label><input id="a-name" name="name" className="input" required placeholder="Ridetech coilover kit" /></div>
            <div><label className="label" htmlFor="a-vendor">Vendor</label><input id="a-vendor" name="vendor" className="input" /></div>
            <div><label className="label" htmlFor="a-comm">Commission (%)</label><input id="a-comm" name="commissionPct" type="number" className="input" /></div>
            <div className="col-span-2"><label className="label" htmlFor="a-url">Affiliate URL</label><input id="a-url" name="url" className="input" placeholder="https://…" /></div>
            <div><label className="label" htmlFor="a-clicks">Clicks</label><input id="a-clicks" name="clicks" type="number" className="input" defaultValue={0} /></div>
            <div><label className="label" htmlFor="a-conv">Conversions</label><input id="a-conv" name="conversions" type="number" className="input" defaultValue={0} /></div>
            <div><label className="label" htmlFor="a-rev">Revenue ($)</label><input id="a-rev" name="revenue" className="input" inputMode="decimal" /></div>
            <div>
              <label className="label" htmlFor="a-vehicle">Build</label>
              <select id="a-vehicle" name="vehicleId" className="select" defaultValue="">
                <option value="">—</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
          </div>
          {state.error && <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{state.error}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button></div>
        </form>
      </Modal>
    </>
  );
}
