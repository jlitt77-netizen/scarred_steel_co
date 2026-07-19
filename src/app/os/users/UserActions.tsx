"use client";

import { useState, useTransition } from "react";
import { resetUserPasswordAction } from "./actions";

export function ResetPasswordButton({ userId, canWrite }: { userId: string; canWrite: boolean }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ password?: string; error?: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (!canWrite) return <span className="text-xs text-paper-muted">—</span>;

  if (result?.password) {
    return (
      <span className="inline-flex items-center gap-2">
        <code className="rounded bg-bg-charcoal px-2 py-0.5 text-xs text-status-gain">{result.password}</code>
        <span className="text-[10px] uppercase tracking-wide text-paper-muted">copy now</span>
      </span>
    );
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <button
          className="btn px-2 py-1 text-xs"
          disabled={pending}
          onClick={() => start(async () => { const r = await resetUserPasswordAction(userId); setResult(r); setConfirming(false); })}
        >
          {pending ? "Resetting…" : "Confirm reset"}
        </button>
        <button className="btn-secondary px-2 py-1 text-xs" onClick={() => setConfirming(false)}>Cancel</button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button className="btn-secondary px-2 py-1 text-xs" onClick={() => setConfirming(true)}>Reset password</button>
      {result?.error && <span className="text-xs text-status-critical">{result.error}</span>}
    </span>
  );
}
