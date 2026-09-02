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
export const NAV_CLEARANCE = 80;

/**
 * Focused steps inside a flow, and everything before sign-in, show no nav.
 * Listed here rather than by each page opting in, because the nav is mounted
 * once in the root layout.
 */
const HIDDEN_EXACT = ["/"];
const HIDDEN_PREFIXES = ["/auth", "/booking/pickup", "/advanced/dropoff"];

export default function BottomNav() {
  const pathname = usePathname();

  const hidden =
    HIDDEN_EXACT.includes(pathname) ||
    HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  const activeIndex = TABS.findIndex(
    (tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`)
  );

  if (hidden) return null;

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      {/* `.glass` and `.glass-clear` live in globals.css so every frosted panel
          is tuned in one place. The nav is the most transparent of them: it
          sits over the map, and the map should read through it. */}
      <div className="glass glass-clear pointer-events-auto flex w-full max-w-[358px] rounded-pill p-1.5">
        {TABS.map(({ label, href, icon: Icon }, index) => {
          const active = index === activeIndex;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              /*
               * Colour alone marks the selected tab — no pill, dot, underline
               * or highlight behind the icon. Every tab keeps its label, and
               * stacking the label under the icon gives each one the full
               * column width, so nothing truncates to "Plan T…".
               */
              className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
            >
              <Icon
                className={`h-[20px] w-[20px] shrink-0 transition-colors duration-200 ${
                  active ? "text-primary" : "text-text-muted"
                }`}
              />
              <span
                className={`whitespace-nowrap text-[11px] leading-none transition-colors duration-200 ${
                  active ? "font-bold text-primary" : "font-medium text-text-muted"
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
