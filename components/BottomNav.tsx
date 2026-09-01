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

/** One shared curve, with a little overshoot so movement settles rather than stops. */
const EASE = "ease-[cubic-bezier(0.32,1.28,0.5,1)]";

export default function BottomNav() {
  const pathname = usePathname();
  const activeIndex = TABS.findIndex(
    (tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`)
  );

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      {/* `.glass` lives in globals.css so every frosted panel is tuned in one place. */}
      <div className="glass pointer-events-auto flex w-full max-w-[358px] gap-1 rounded-pill p-1.5">
        {TABS.map(({ label, href, icon: Icon }, index) => {
          const active = index === activeIndex;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              /*
               * The selected tab grows to make room for its own label and the
               * others shrink to icons, so the highlight expands into place
               * rather than jumping between four fixed slots. It also removes
               * the truncation the four-label layout used to suffer at narrow
               * widths.
               */
              className={`group relative flex items-center justify-center gap-2 overflow-hidden rounded-pill py-2.5 transition-[flex-grow,background-color,color] duration-[420ms] ${EASE} ${
                active
                  ? "flex-[2.2] bg-primary text-white shadow-[0_4px_12px_rgba(16,37,68,0.25)]"
                  : "flex-1 text-text-secondary hover:bg-white/60"
              }`}
            >
              <Icon
                className={`h-[19px] w-[19px] shrink-0 transition-transform duration-[420ms] ${EASE} ${
                  active ? "scale-105" : "group-active:scale-90"
                }`}
              />
              <span
                className={`overflow-hidden whitespace-nowrap text-[12.5px] font-bold transition-[max-width,opacity] duration-[420ms] ${EASE} ${
                  active ? "max-w-[90px] opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                {label}
              </span>
              <span className="sr-only">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
