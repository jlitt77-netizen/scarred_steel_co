"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconSearch, IconPlus, IconBell, IconAlert, IconUser, IconMenu, IconPanelLeft, IconLogout, IconChevron,
} from "@/components/ui/icons";

// Quick Add taxonomy (Section 9). Only actions whose feature exists are enabled;
// everything else renders as an explicit disabled state (no fake functionality).
const QUICK_ADD = [
  { label: "Vehicle", href: "/os/vehicles", enabled: true },
  { label: "Build", enabled: false },
  { label: "Task", enabled: false },
  { label: "Expense", enabled: false },
  { label: "Revenue", enabled: false },
  { label: "Camera Session", enabled: false },
  { label: "Episode", enabled: false },
  { label: "Social Post", enabled: false },
  { label: "Sponsor", enabled: false },
  { label: "Merch Drop", enabled: false },
  { label: "Risk", enabled: false },
];

export function CommandBar({
  today,
  userName,
  roleLabel,
  riskCount,
  onToggleSidebar,
  onOpenMobileNav,
  canQuickAdd,
}: {
  today: string;
  userName: string;
  roleLabel: string;
  riskCount: number | null;
  onToggleSidebar: () => void;
  onOpenMobileNav: () => void;
  canQuickAdd: boolean;
}) {
  const [quickOpen, setQuickOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-bg-gunmetal bg-bg-coal/95 px-3 backdrop-blur">
      {/* Mobile nav toggle */}
      <button className="btn-ghost lg:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
        <IconMenu />
      </button>
      {/* Desktop collapse toggle */}
      <button className="btn-ghost hidden lg:inline-flex" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        <IconPanelLeft />
      </button>

      {/* Global search — placeholder (search lands in a later phase) */}
      <div className="relative hidden max-w-md flex-1 sm:block">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-paper-muted" />
        <input
          className="input pl-9 disabled:opacity-60"
          placeholder="Search (coming soon)"
          aria-label="Global search"
          disabled
        />
      </div>

      <div className="flex-1 sm:hidden" />

      {/* Quick Add */}
      {canQuickAdd && (
        <div className="relative">
          <button className="btn h-9 py-0" onClick={() => setQuickOpen((v) => !v)} aria-haspopup="menu" aria-expanded={quickOpen}>
            <IconPlus /> <span className="hidden sm:inline">Quick Add</span>
          </button>
          {quickOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setQuickOpen(false)} />
              <div className="panel-raised absolute right-0 z-20 mt-1 w-52 animate-fade-in p-1" role="menu">
                {QUICK_ADD.map((q) =>
                  q.enabled && q.href ? (
                    <Link key={q.label} href={q.href} onClick={() => setQuickOpen(false)} className="block rounded px-3 py-1.5 text-sm text-paper-steel hover:bg-bg-gunmetal hover:text-paper-warm" role="menuitem">
                      {q.label}
                    </Link>
                  ) : (
                    <div key={q.label} className="flex items-center justify-between rounded px-3 py-1.5 text-sm text-paper-muted/60" role="menuitem" aria-disabled="true">
                      {q.label}
                      <span className="text-[9px] uppercase tracking-wide">soon</span>
                    </div>
                  ),
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Current date */}
      <div className="hidden items-center px-2 text-xs text-paper-muted md:flex tnum">{today}</div>

      {/* Risk indicator */}
      {riskCount != null && (
        <Link href="/os/risk" className="btn-ghost relative" aria-label={`${riskCount} open risks`} title={`${riskCount} open risks`}>
          <IconAlert className={riskCount > 0 ? "text-status-risk" : "text-paper-muted"} />
          {riskCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-risk px-1 text-[10px] font-bold text-paper-warm tnum">
              {riskCount}
            </span>
          )}
        </Link>
      )}

      {/* Notifications — placeholder */}
      <button className="btn-ghost" aria-label="Notifications (coming soon)" title="Notifications (coming soon)" disabled>
        <IconBell />
      </button>

      {/* User profile */}
      <div className="relative">
        <button className="btn-ghost flex items-center gap-1.5" onClick={() => setUserOpen((v) => !v)} aria-haspopup="menu" aria-expanded={userOpen}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-bg-panel bg-bg-charcoal"><IconUser className="text-paper-steel" /></span>
          <span className="hidden text-left text-xs leading-tight md:block">
            <span className="block font-medium text-paper-warm">{userName}</span>
            <span className="block text-paper-muted">{roleLabel}</span>
          </span>
          <IconChevron className="hidden rotate-90 text-paper-muted md:block" />
        </button>
        {userOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
            <div className="panel-raised absolute right-0 z-20 mt-1 w-44 animate-fade-in p-1" role="menu">
              <div className="border-b border-bg-gunmetal px-3 py-2 md:hidden">
                <div className="text-sm font-medium text-paper-warm">{userName}</div>
                <div className="text-xs text-paper-muted">{roleLabel}</div>
              </div>
              <form action="/logout" method="post">
                <button type="submit" className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-sm text-paper-steel hover:bg-bg-gunmetal hover:text-paper-warm" role="menuitem">
                  <IconLogout /> Sign out
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
