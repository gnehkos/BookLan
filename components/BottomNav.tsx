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
  const activeIndex = TABS.findIndex(
    (tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`)
  );

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="pointer-events-auto relative flex w-full max-w-[358px] items-stretch rounded-pill border border-border bg-white/90 p-1.5 shadow-[var(--shadow-float)] backdrop-blur-xl">
        {/* One pill that slides between tabs, rather than four that pop in and
            out. The overshooting easing gives it the small settle that makes
            the movement feel physical. */}
        <span
          aria-hidden
          className="absolute inset-y-1.5 rounded-pill bg-primary transition-[left,opacity] duration-[420ms] ease-[cubic-bezier(0.34,1.32,0.5,1)]"
          style={{
            width: `calc((100% - 12px) / ${TABS.length})`,
            left: `calc(6px + ${activeIndex < 0 ? 0 : activeIndex} * (100% - 12px) / ${TABS.length})`,
            opacity: activeIndex < 0 ? 0 : 1,
          }}
        />

        {TABS.map(({ label, href, icon: Icon }, index) => {
          const active = index === activeIndex;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              // Icon over label keeps all four labels fully readable, so
              // nothing truncates to "Plan T…" at narrow widths.
              className="relative z-10 flex flex-1 flex-col items-center justify-center gap-1 rounded-pill py-2"
            >
              <Icon
                className={`h-[20px] w-[20px] shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.5,1)] ${
                  active ? "-translate-y-0.5 scale-110 text-white" : "text-text-muted"
                }`}
              />
              <span
                className={`whitespace-nowrap text-[11px] leading-none transition-colors duration-200 ${
                  active ? "font-bold text-white" : "font-medium text-text-muted"
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
