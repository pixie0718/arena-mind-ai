"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV_ITEMS } from "@/constants/navigation";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-background/85 backdrop-blur-xl supports-backdrop-blur:bg-background/70"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative flex items-center justify-center">
                  <Icon className="size-5" strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
                  {isActive && (
                    <span
                      className="glow-primary absolute -bottom-1.5 size-1 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
