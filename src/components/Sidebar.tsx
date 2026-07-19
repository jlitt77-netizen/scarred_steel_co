"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavSection } from "@/lib/navigation";

export function Sidebar({
  product,
  sections,
  userName,
  roleLabel,
}: {
  product: { title: string; accent: string; home: string };
  sections: NavSection[];
  userName: string;
  roleLabel: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-steel-800 bg-steel-900">
      <div className="border-b border-steel-800 px-5 py-4">
        <Link href={product.home} className="block">
          <div className="text-sm font-black uppercase tracking-widest text-steel-100">
            Scarred <span className="text-rust-500">Steel</span> Co.
          </div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wider text-steel-500">
            {product.title}
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-5">
            <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-steel-600">
              {section.title}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                        active
                          ? "bg-rust-500/15 text-rust-400"
                          : "text-steel-300 hover:bg-steel-800 hover:text-steel-100"
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.placeholder && (
                        <span className="ml-2 rounded bg-steel-800 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-steel-500">
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

      <div className="border-t border-steel-800 px-4 py-3">
        <div className="text-sm font-medium text-steel-200">{userName}</div>
        <div className="text-xs text-steel-500">{roleLabel}</div>
        <form action="/logout" method="post" className="mt-2">
          <button type="submit" className="text-xs text-steel-400 hover:text-rust-400">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
