"use client";

import { useEffect, useState } from "react";
import type { NavSection } from "@/lib/navigation";
import { Sidebar } from "./Sidebar";
import { CommandBar } from "./CommandBar";

// The permanent CEO OS shell (Section 8): collapsible left sidebar + top command
// bar + main workspace. Mobile collapses the sidebar into an overlay drawer.
export function AppShell({
  product,
  sections,
  userName,
  roleLabel,
  today,
  riskCount,
  canQuickAdd,
  children,
}: {
  product: { title: string; home: string };
  sections: NavSection[];
  userName: string;
  roleLabel: string;
  today: string;
  riskCount: number | null;
  canQuickAdd: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("ss.sidebar.collapsed") === "1");
  }, []);
  const toggle = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem("ss.sidebar.collapsed", next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg-nearblack">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar product={product} sections={sections} collapsed={collapsed} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full animate-slide-in-right shadow-drawer">
            <Sidebar product={product} sections={sections} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <CommandBar
          today={today}
          userName={userName}
          roleLabel={roleLabel}
          riskCount={riskCount}
          canQuickAdd={canQuickAdd}
          onToggleSidebar={toggle}
          onOpenMobileNav={() => setMobileOpen(true)}
        />
        <main className="scroll-steel flex-1 overflow-y-auto p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
