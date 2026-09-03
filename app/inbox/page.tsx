"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Bus,
  CircleAlert,
  CircleCheck,
  MessageCircle,
  XCircle,
} from "lucide-react";
import ActiveTripBanner from "@/components/ActiveTripBanner";
import CompanyLogo from "@/components/CompanyLogo";
import { safeQuery, supabase } from "@/lib/supabase";
import { driverNameFor } from "@/constants/drivers";
import { lastMessage, listThreads, previewText, relativeTime, type ChatThread } from "@/lib/chat";

type Tab = "messages" | "notifications";

type BookingRow = {
  id: string;
  ticket_id: string;
  status: string;
  distance_remaining_km: number;
  created_at: string;
  active_trips: { destination: string; companies: { name: string } | null } | null;
};

type Notification = {
  id: string;
  title: string;
  body: string;
  at: number;
  tone: "info" | "warning" | "success" | "error";
};

const TONE_STYLES: Record<Notification["tone"], { bg: string; text: string }> = {
  info: { bg: "bg-accent", text: "text-primary" },
  warning: { bg: "bg-[#FFFBEB]", text: "text-warning" },
  success: { bg: "bg-[#DCFCE7]", text: "text-success" },
  error: { bg: "bg-[#FEF2F2]", text: "text-error" },
};

const TONE_ICONS: Record<Notification["tone"], typeof CircleCheck> = {
  info: CircleCheck,
  warning: CircleAlert,
  success: BadgeCheck,
  error: XCircle,
};

/** Notifications are derived from the passenger's real bookings. */
function notificationsFor(bookings: BookingRow[]): Notification[] {
  return bookings.flatMap((booking) => {
    const company = booking.active_trips?.companies?.name ?? "your bus";
    const destination = booking.active_trips?.destination ?? "your destination";
    const at = new Date(booking.created_at).getTime();

    if (booking.status === "cancelled") {
      return [
        {
          id: `${booking.id}-cancelled`,
          title: "Booking Cancelled",
          body: `Your ${company} booking to ${destination} was cancelled.`,
          at,
          tone: "error" as const,
        },
      ];
    }

    if (booking.status === "completed") {
      return [
        {
          id: `${booking.id}-complete`,
          title: "Trip Complete",
          body: `Your trip to ${destination} is complete. Rate your experience.`,
          at,
          tone: "success" as const,
        },
      ];
    }

    const items: Notification[] = [
      {
        id: `${booking.id}-confirmed`,
        title: "Booking Confirmed",
        body: `Your seat on ${company} to ${destination} has been confirmed.`,
        at,
        tone: "info",
      },
    ];

    if (booking.distance_remaining_km > 0 && booking.distance_remaining_km <= 5) {
      items.unshift({
        id: `${booking.id}-approaching`,
        title: "Vehicle Approaching",
        body: `Your bus is ${booking.distance_remaining_km} km away. Be ready at your pickup point.`,
        at: at + 1,
        tone: "warning",
      });
    }

    return items;
  });
}

export default function InboxPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("messages");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setThreads(listThreads());

    const userId = localStorage.getItem("booklan_user_id");
    if (!userId) {
      router.replace("/");
      return;
    }

    let cancelled = false;
    (async () => {
      const { data } = await safeQuery(
        supabase
          .from("bookings")
          .select(
            "id, ticket_id, status, distance_remaining_km, created_at, active_trips(destination, companies(name))"
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10)
      );
      if (cancelled) return;
      setBookings((data as unknown as BookingRow[]) ?? []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const notifications = useMemo(
    () => notificationsFor(bookings).sort((a, b) => b.at - a.at),
    [bookings]
  );

  const count = tab === "messages" ? threads.length : notifications.length;

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[393px] flex-1 flex-col pb-28">
        <div className="border-b border-border bg-white px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <button
              // Explicit: leaving a chat pushes /inbox, so history holds
              // inbox -> chat -> inbox and router.back() returned to the chat.
              onClick={() => router.push("/home")}
              aria-label="Back"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface"
            >
              <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
            </button>
            <h1 className="flex-1 text-[22px] font-extrabold tracking-[-0.4px] text-text-primary">
              Inbox
            </h1>
            <span className="rounded-[8px] bg-accent px-2.5 py-1 text-[11px] font-bold text-primary">
              {count} item{count === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-4 flex gap-1 rounded-[13px] border border-border bg-surface p-1.5">
            {(["messages", "notifications"] as Tab[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setTab(mode)}
                className={`flex-1 rounded-[10px] py-2 text-[13px] font-bold capitalize transition-colors ${
                  tab === mode
                    ? "bg-white text-text-primary shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                    : "text-text-muted"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 px-5 pt-3">
          {tab === "messages" && (
            <>
              {threads.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                  <MessageCircle className="h-10 w-10 text-text-muted" />
                  <p className="text-[14px] text-text-secondary">No messages yet.</p>
                  <p className="max-w-[260px] text-[12px] text-text-muted">
                    Message your driver from the tracking screen and the conversation shows up
                    here.
                  </p>
                </div>
              )}

              {threads.map((thread) => {
                const last = lastMessage(thread);
                return (
                  <button
                    key={thread.bookingId}
                    onClick={() => router.push(`/inbox/${thread.bookingId}`)}
                    className="flex items-center gap-3 rounded-[16px] border border-border bg-white p-4 text-left"
                  >
                    {/* Company logo as the avatar, driver's name as the title. */}
                    <CompanyLogo name={thread.company} size={44} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-bold text-text-primary">
                          {thread.driver}
                        </span>
                        <span className="shrink-0 text-[11px] text-text-muted">
                          {relativeTime(last?.at ?? 0)}
                        </span>
                      </div>
                      <span className="truncate text-[12px] text-text-secondary">
                        {thread.company} · to {thread.destination}
                      </span>
                      <span className="truncate text-[12px] text-text-muted">
                        {last?.from === "you" ? "You: " : ""}
                        {previewText(last)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {tab === "notifications" && (
            <>
              {loading && (
                <>
                  <div className="h-[86px] w-full animate-pulse rounded-[16px] bg-white" />
                  <div className="h-[86px] w-full animate-pulse rounded-[16px] bg-white" />
                </>
              )}

              {!loading && notifications.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                  <Bus className="h-10 w-10 text-text-muted" />
                  <p className="text-[14px] text-text-secondary">Nothing here yet.</p>
                </div>
              )}

              {!loading &&
                notifications.map((item) => {
                  const tone = TONE_STYLES[item.tone];
                  const Icon = TONE_ICONS[item.tone];
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-[16px] border border-border bg-white p-4"
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${tone.bg}`}
                      >
                        <Icon className={`h-4 w-4 ${tone.text}`} />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-[13px] font-bold text-text-primary">
                          {item.title}
                        </span>
                        <p className="mt-0.5 text-[12px] leading-[18px] text-text-muted">
                          {item.body}
                        </p>
                        <span className="mt-1 text-[11px] font-semibold text-border">
                          {relativeTime(item.at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </>
          )}
        </div>
      </div>

      <ActiveTripBanner />
    </div>
  );
}
