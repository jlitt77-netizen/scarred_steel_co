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

  const result = await authenticate(email, password);
  if (!result) {
    return { error: "Invalid email or password." };
  }

  await createSession({
    userId: result.userId,
    email: result.email,
    isInternal: result.isInternal,
  });

  const dest = next && next.startsWith("/") ? next : result.isInternal ? "/os" : "/portal";
  redirect(dest);
}
