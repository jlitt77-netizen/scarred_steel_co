"use server";

import { redirect } from "next/navigation";
import { authenticate } from "@/lib/auth";
import { createSession } from "@/lib/session";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  // redirect() works by throwing, so it must stay outside the try/catch.
  let isInternal: boolean;
  try {
    const result = await authenticate(email, password);
    if (!result) {
      return { error: "Invalid email or password." };
    }

    await createSession({
      userId: result.userId,
      email: result.email,
      isInternal: result.isInternal,
    });
    isInternal = result.isInternal;
  } catch (err) {
    // Infrastructure failure (database unreachable, bad credentials, missing
    // SESSION_SECRET). Log the real cause server-side; show a safe message.
    console.error("Login failed due to a server error:", err);
    return { error: "Sign-in is temporarily unavailable. Please try again shortly." };
  }

  const dest = next && next.startsWith("/") ? next : isInternal ? "/os" : "/portal";
  redirect(dest);
}
