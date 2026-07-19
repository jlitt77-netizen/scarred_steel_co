"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { NavSection } from "@/lib/navigation";
import { Logo } from "@/components/ui/Logo";
import { IconMenu, IconLogout } from "@/components/ui/icons";

// External Portal shell (Section 19) — more cinematic than the CEO OS: a
// translucent top bar over a dark, imagery-ready canvas. No operational command
// bar; the brand story is meant to breathe here.
export function PortalShell({
  sections,
  userName,
  children,
}: {
  sections: NavSection[];
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = sections.flatMap((s) => s.items);

  return (
    <div className="min-h-screen bg-bg-nearblack">
      <header className="sticky top-0 z-30 border-b border-bg-gunmetal bg-bg-nearblack/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/portal" className="flex items-center gap-2">
            <Logo variant="full" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded px-3 py-1.5 text-sm ${
                    active ? "text-rust-400" : "text-paper-steel hover:text-paper-warm"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-paper-muted sm:inline">{userName}</span>
            <form action="/logout" method="post" className="hidden md:block">
              <button className="btn-ghost" title="Sign out" aria-label="Sign out"><IconLogout /></button>
            </form>
            <button className="btn-ghost md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu"><IconMenu /></button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-bg-gunmetal px-4 py-2 md:hidden">
            {items.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="block rounded px-2 py-2 text-sm text-paper-steel hover:bg-bg-charcoal">
                {item.label}
              </Link>
            ))}
            <form action="/logout" method="post">
              <button className="mt-1 flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-paper-steel hover:bg-bg-charcoal"><IconLogout /> Sign out</button>
            </form>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
