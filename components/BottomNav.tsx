"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, Home, Ticket, User } from "lucide-react";
import type { ComponentType } from "react";

const TABS: { label: string; href: string; icon: ComponentType<{ className?: string }> }[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Plan Trip", href: "/advanced", icon: CalendarClock },
  { label: "Bookings", href: "/bookings", icon: Ticket },
  { label: "Profile", href: "/profile", icon: User },
];

/** Height of the bar plus its bottom margin — screens pad past this. */
export const NAV_CLEARANCE = 88;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-[358px] items-stretch rounded-pill border border-border bg-white p-1.5 shadow-[var(--shadow-float)]">
        {TABS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              // Icon over label keeps all four labels fully readable, so
              // nothing truncates to "Plan T…" at narrow widths.
              className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-pill py-2 transition-colors ${
                active ? "bg-accent" : ""
              }`}
            >
              <Icon
                className={`h-[20px] w-[20px] shrink-0 ${
                  active ? "text-primary" : "text-text-muted"
                }`}
              />
              <span
                className={`whitespace-nowrap text-[11px] leading-none ${
                  active ? "font-semibold text-primary" : "font-medium text-text-muted"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
