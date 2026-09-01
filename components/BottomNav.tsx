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

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-[68px] w-full max-w-[390px] items-stretch">
        {TABS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              // Icon over label: every label stays fully visible at any width,
              // so nothing truncates to "Plan T…".
              className="flex flex-1 flex-col items-center justify-center gap-1 px-1"
            >
              <Icon
                className={`h-[22px] w-[22px] shrink-0 ${
                  active ? "text-primary" : "text-text-muted"
                }`}
              />
              <span
                className={`whitespace-nowrap text-[11px] leading-none ${
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
