"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Ticket, CalendarClock, User } from "lucide-react";
import type { ComponentType } from "react";

const TABS: { label: string; href: string; icon: ComponentType<{ className?: string }> }[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "My Bookings", href: "/bookings", icon: Ticket },
  { label: "Advanced Booking", href: "/advanced", icon: CalendarClock },
  { label: "Profile", href: "/profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[390px] -translate-x-1/2 border-t border-border bg-white">
      <div className="flex h-16 items-stretch justify-between px-1">
        {TABS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="flex flex-1 flex-col items-center justify-center gap-1"
            >
              <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-text-secondary"}`} />
              <span
                className={`text-[11px] leading-none ${
                  active ? "font-semibold text-primary" : "text-text-secondary"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
