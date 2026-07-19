"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import { use } from "react";

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
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black uppercase tracking-widest text-steel-100">
            Scarred <span className="text-rust-500">Steel</span> Co.
          </h1>
          <p className="mt-1 text-sm text-steel-400">Platform Sign In</p>
        </div>

        <form action={action} className="card space-y-4">
          <input type="hidden" name="next" value={next ?? ""} />
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              className="input"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="input"
              placeholder="••••••••"
              required
            />
          </div>

          {state.error && (
            <p className="rounded-md border border-rust-600 bg-rust-600/10 px-3 py-2 text-sm text-rust-400">
              {state.error}
            </p>
          )}

          <button type="submit" className="btn w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-steel-500">
          Internal CEO OS and external Portal share this sign-in.
        </p>
      </div>
    </main>
  );
}
