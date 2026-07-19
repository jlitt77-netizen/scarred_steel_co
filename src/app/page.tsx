import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";

// Root entry: route users to the correct product based on their auth context.
export default async function Home() {
  const ctx = await getAuth();
  if (!ctx) redirect("/login");
  redirect(ctx.isInternal ? "/os" : "/portal");
}
