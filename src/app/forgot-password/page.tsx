"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { requestResetAction, type ForgotState } from "./actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(requestResetAction, {});

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="surface-texture absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg-nearblack via-bg-nearblack/70 to-transparent" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex justify-center"><Logo variant="full" className="h-28 sm:h-36" /></div>
          <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-paper-muted">Reset Password</p>
        </div>

        {state.ok ? (
          <div className="panel-raised space-y-3 p-6 text-sm text-paper-steel">
            <p className="text-paper-warm">Request received.</p>
            <p>If an account exists for that email, the account owner has been notified and can issue a new
              temporary password from <span className="text-paper-warm">Settings → Users</span>.</p>
            <p className="text-xs text-paper-muted">You&apos;ll receive the temporary password from the owner, then can change it after signing in.</p>
            <Link href="/login" className="btn mt-2 inline-block">Back to sign in</Link>
          </div>
        ) : (
          <form action={action} className="panel-raised space-y-4 p-6">
            <p className="text-sm text-paper-muted">Enter your account email and we&apos;ll start a reset.</p>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="username" className="input" placeholder="you@scarredsteel.co" required />
            </div>
            {state.error && (
              <p className="rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical" role="alert">{state.error}</p>
            )}
            <button type="submit" className="btn w-full" disabled={pending}>{pending ? "Sending…" : "Request reset"}</button>
            <Link href="/login" className="block text-center text-xs text-paper-muted hover:text-paper-steel">Back to sign in</Link>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-paper-muted">
          Emailed self-service resets can be enabled once an email provider is connected.
        </p>
      </div>
    </main>
  );
}
