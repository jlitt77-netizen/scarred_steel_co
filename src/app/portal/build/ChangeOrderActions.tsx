"use client";

import { useState, useTransition } from "react";
import { changeOrderDecisionAction } from "./actions";

export function ChangeOrderDecision({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const decide = (approve: boolean) => start(async () => {
    const r = await changeOrderDecisionAction(id, approve);
    setError(r.error ?? null);
  });
  return (
    <div className="flex items-center gap-2">
      <button className="btn px-3 py-1 text-xs" disabled={pending} onClick={() => decide(true)}>Approve</button>
      <button className="btn-secondary px-3 py-1 text-xs" disabled={pending} onClick={() => decide(false)}>Decline</button>
      {error && <span className="text-xs text-status-critical">{error}</span>}
    </div>
  );
}
