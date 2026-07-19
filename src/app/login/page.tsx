"use client";

import { useActionState, use } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = use(searchParams);
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Cinematic textured backdrop */}
      <div className="surface-texture absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg-nearblack via-bg-nearblack/70 to-transparent" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex justify-center">
            <Logo variant="full" className="h-36 sm:h-44" />
          </div>
          <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-paper-muted">
            Command Center · Sign In
          </p>
        </div>

        <form action={action} className="panel-raised space-y-4 p-6">
          <input type="hidden" name="next" value={next ?? ""} />
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="username" className="input" placeholder="you@scarredsteel.co" required />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" className="input" placeholder="••••••••" required />
          </div>

          {state.error && (
            <p className="flex items-center gap-2 rounded border border-status-critical/50 bg-status-critical/10 px-3 py-2 text-sm text-status-critical" role="alert">
              {state.error}
            </p>
          )}

          <button type="submit" className="btn w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign In"}
          </button>

          <Link href="/forgot-password" className="block text-center text-xs text-paper-muted hover:text-paper-steel">
            Forgot password?
          </Link>
        </form>

        <p className="mt-4 text-center text-xs text-paper-muted">
          Internal CEO OS and external Portal share this sign-in.
        </p>
      </div>
    </main>
  );
}
