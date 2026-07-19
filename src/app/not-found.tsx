import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <main className="surface-texture flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo variant="full" className="text-2xl" />
      <p className="mt-6 font-display text-6xl uppercase text-paper-warm">404</p>
      <p className="mt-2 text-paper-muted">This bay is empty. The page you&apos;re looking for isn&apos;t here.</p>
      <Link href="/" className="btn mt-6">Back to the shop</Link>
    </main>
  );
}
