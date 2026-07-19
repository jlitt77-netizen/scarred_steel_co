"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import type { NavSection } from "@/lib/navigation";
import { Logo } from "@/components/ui/Logo";
import {
  IconGauge, IconAlert, IconLayers, IconCalendar, IconTruck, IconWrench,
  IconUser, IconDollar, IconSearch, IconClock,
} from "@/components/ui/icons";

const ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  "/os/ceo": IconGauge, "/os/risk": IconAlert, "/os/forecast": IconLayers,
  "/os/calendar": IconCalendar, "/os/vehicles": IconTruck, "/os/partner-shop": IconWrench,
  "/os/workforce": IconUser, "/os/fleet": IconTruck, "/os/finance": IconDollar,
  "/os/media": IconLayers, "/os/social": IconLayers, "/os/sponsors": IconLayers,
  "/os/commerce": IconLayers, "/os/digital": IconLayers, "/os/giveaways": IconLayers,
  "/os/finds": IconSearch, "/os/rescues": IconWrench, "/os/build-lab": IconLayers,
  "/os/audit": IconClock, "/os/settings": IconGauge, "/os/users": IconUser,
};

export function Sidebar({
  product,
  sections,
  collapsed = false,
  onNavigate,
}: {
  product: { title: string; home: string };
  sections: NavSection[];
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div
      className={`flex h-full flex-col border-r border-bg-gunmetal bg-bg-coal ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex h-14 items-center border-b border-bg-gunmetal px-3">
        <Link href={product.home} onClick={onNavigate} className="flex items-center gap-2 overflow-hidden">
          <Logo variant={collapsed ? "compact" : "full"} />
        </Link>
      </div>
      {!collapsed && (
        <div className="border-b border-bg-gunmetal px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-paper-muted">
          {product.title}
        </div>
      )}

      <nav className="scroll-steel flex-1 overflow-y-auto px-2 py-3">
        {sections.map((section) => (
          <div key={section.title} className="mb-4">
            {!collapsed && (
              <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-paper-muted/70">
                {section.title}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = ICONS[item.href] ?? IconLayers;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={`group flex items-center gap-2.5 rounded px-2 py-1.5 text-sm ${
                        active
                          ? "border-l-2 border-rust bg-rust/10 text-rust-400"
                          : "border-l-2 border-transparent text-paper-steel hover:bg-bg-charcoal hover:text-paper-warm"
                      } ${collapsed ? "justify-center" : ""}`}
                    >
                      <Icon className={`shrink-0 text-base ${active ? "text-rust-400" : "text-paper-muted group-hover:text-paper-steel"}`} />
                      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                      {!collapsed && item.placeholder && (
                        <span className="rounded bg-bg-gunmetal px-1 py-0.5 text-[9px] uppercase tracking-wide text-paper-muted">
                          P{item.phase}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
