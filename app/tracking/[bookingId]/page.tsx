"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Phone,
  Send,
  Ticket,
  X,
} from "lucide-react";
import Button from "@/components/Button";
import BottomNav, { NAV_CLEARANCE } from "@/components/BottomNav";
import ErrorState from "@/components/ErrorState";
import { safeQuery, supabase } from "@/lib/supabase";
import { AVG_SPEED_KMH } from "@/constants/booking";
import { releaseTripSeats } from "@/lib/seats";

const TrackingMap = dynamic(() => import("@/components/TrackingMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

// Demo contact details — the schema has no driver or company phone column yet.
const DRIVER_NAME = "Sok Dara";
const DRIVER_PHONE = "+85512345678";

type VehicleType = "bus" | "van";

type ChatMessage = { id: number; from: "you" | "driver"; text: string };

/**
 * Pickup handover. In production the driver's app approves the ticket and the
 * passenger's app follows; with no driver app yet, the bus closes the distance
 * on a timer and the approval is simulated so the flow can be demonstrated.
 */
type TripPhase = "approaching" | "verifying" | "approved";

/** Roughly how tall the floating panel is, so the map can frame around it. */
const PANEL_HEIGHT = 220;

const APPROACH_TICK_MS = 1500;
const VERIFY_MS = 2600;
const APPROVED_MS = 1400;

type BookingRow = {
  id: string;
  trip_id: string;
  ticket_id: string;
  seat_numbers: number[];
  pickup_lat: number;
  pickup_lng: number;
  distance_remaining_km: number;
  status: string;
  active_trips: {
    distance_km: number;
    destination: string;
    companies: { name: string; vehicle_type: VehicleType } | null;
  } | null;
};

export default function TrackingPage() {
  const router = useRouter();
  const params = useParams<{ bookingId: string }>();
  const bookingId = params.bookingId;

  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [phase, setPhase] = useState<TripPhase>("approaching");
  const distanceRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBooking() {
      setLoading(true);
      setLoadError(null);
      const { data, error: fetchError } = await safeQuery(
        supabase
          .from("bookings")
          .select(
            "id, trip_id, ticket_id, seat_numbers, pickup_lat, pickup_lng, distance_remaining_km, status, active_trips(distance_km, destination, companies(name, vehicle_type))"
          )
          .eq("id", bookingId)
          .single()
      );

      if (!cancelled) {
        if (fetchError || !data) {
          setLoadError("Couldn't load this booking. It may not exist.");
        } else {
          setBooking(data as unknown as BookingRow);
          setDistance(data.distance_remaining_km);
        }
        setLoading(false);
      }
    }

    loadBooking();
    return () => {
      cancelled = true;
    };
  }, [bookingId, refreshKey]);

  useEffect(() => {
    distanceRef.current = distance;
  }, [distance]);

  useEffect(() => {
    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings", filter: `id=eq.${bookingId}` },
        (payload) => {
          const updated = payload.new as { distance_remaining_km: number; status: string };
          setDistance(updated.distance_remaining_km);
          setBooking((current) => (current ? { ...current, status: updated.status } : current));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  // Drive the bus in over a few seconds so the approach is actually visible.
  useEffect(() => {
    if (phase !== "approaching" || distance === null || distance <= 0) return;

    const interval = setInterval(async () => {
      const current = distanceRef.current;
      if (current === null || current <= 0) return;

      const step = Math.max(1, Math.ceil(current / 4));
      const next = Math.max(0, current - step);
      setDistance(next);
      await supabase.from("bookings").update({ distance_remaining_km: next }).eq("id", bookingId);
    }, APPROACH_TICK_MS);

    return () => clearInterval(interval);
  }, [bookingId, distance, phase]);

  // Arrived → the driver checks the ticket → approves → the trip begins.
  useEffect(() => {
    if (phase !== "approaching" || distance === null || distance > 0) return;
    const timer = setTimeout(() => setPhase("verifying"), 600);
    return () => clearTimeout(timer);
  }, [distance, phase]);

  useEffect(() => {
    if (phase !== "verifying") return;
    const timer = setTimeout(() => setPhase("approved"), VERIFY_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "approved") return;
    const timer = setTimeout(() => router.push(`/trip/${bookingId}`), APPROVED_MS);
    return () => clearTimeout(timer);
  }, [phase, router, bookingId]);

  async function handleConfirmCancel() {
    setCancelling(true);
    setCancelError(null);
    const { error } = await safeQuery(
      supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId)
    );

    if (error) {
      setCancelError("Couldn't cancel this booking. Please try again.");
      setCancelling(false);
      return;
    }

    if (booking) {
      await releaseTripSeats(booking.trip_id, booking.seat_numbers.length);
    }
    router.push("/home");
  }

  function sendMessage() {
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [...current, { id: Date.now(), from: "you", text }]);
    setDraft("");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-white">
        <div className="w-full max-w-[390px] flex-1 px-4 pt-6 pb-24">
          <div className="h-6 w-40 animate-pulse rounded bg-surface" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (loadError || !booking || distance === null) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-white">
        <div className="flex w-full max-w-[390px] flex-1 flex-col pb-24">
          <div className="flex items-center gap-2 px-4 pt-6 pb-3">
            <button
              onClick={() => router.back()}
              aria-label="Back"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface"
            >
              <ArrowLeft className="h-6 w-6 text-text-primary" />
            </button>
          </div>
          <ErrorState
            message={loadError ?? "Couldn't load this booking."}
            onRetry={() => setRefreshKey((k) => k + 1)}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  const companyName = booking.active_trips?.companies?.name ?? "Your bus";
  const destination = booking.active_trips?.destination ?? "your destination";
  const etaMinutes = Math.round((distance / AVG_SPEED_KMH) * 60);

  return (
    // Same 390px phone shell as every other screen, so the map doesn't sprawl
    // across a laptop viewport.
    <div className="fixed inset-0 flex justify-center overflow-hidden bg-surface">
      <div className="relative w-full max-w-[390px] overflow-hidden bg-white">
        <div className="absolute inset-0 z-0">
          <TrackingMap
            lat={booking.pickup_lat}
            lng={booking.pickup_lng}
            bookingId={booking.id}
            distanceKm={distance}
            company={companyName}
            destination={destination}
            etaMinutes={etaMinutes}
            panelHeight={PANEL_HEIGHT + NAV_CLEARANCE}
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-5">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white shadow-sm"
          >
            <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
          </button>
        </div>

        {/* Ticket pill — what the driver checks against on arrival. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-end px-4 pt-5">
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-white px-3 py-1.5 shadow-[var(--shadow-float)]">
            <Ticket className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[12px] font-medium text-text-primary">
              {booking.ticket_id}
            </span>
          </span>
        </div>

        {/* Floating panel: detached from the edges and clear of the nav. */}
        <div
          className="absolute inset-x-4 z-20 rounded-[16px] bg-white p-4 shadow-[var(--shadow-float)]"
          style={{ bottom: NAV_CLEARANCE + 8 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[16px] font-semibold text-text-primary">
                {companyName}
              </span>
              <span className="truncate text-[12px] text-text-secondary">
                Seat{booking.seat_numbers.length > 1 ? "s" : ""} {booking.seat_numbers.join(", ")} ·
                to {destination}
              </span>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => setShowCallModal(true)}
                aria-label="Call driver"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-accent"
              >
                <Phone className="h-[18px] w-[18px] text-primary" />
              </button>
              <button
                onClick={() => setShowChatModal(true)}
                aria-label="Message driver"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-accent"
              >
                <MessageCircle className="h-[18px] w-[18px] text-primary" />
              </button>
            </div>
          </div>

          {phase === "approaching" && (
            <>
              <div className="mt-4 flex items-baseline justify-center gap-2">
                <span className="text-[12px] text-text-secondary">Arriving in</span>
                <span className="text-[36px] font-bold leading-none text-primary">
                  {etaMinutes}
                </span>
                <span className="text-[14px] font-medium text-text-secondary">
                  min · {distance} km
                </span>
              </div>

              <button
                onClick={() => setShowCancelConfirm(true)}
                className="mt-4 flex h-11 w-full items-center justify-center rounded-[12px] border border-error text-[14px] font-semibold text-error hover:bg-error/5"
              >
                Cancel Booking
              </button>
            </>
          )}

          {phase === "verifying" && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <span className="text-[16px] font-semibold text-text-primary">
                Driver is verifying your ticket
              </span>
              <span className="text-center text-[12px] text-text-secondary">
                Show {booking.ticket_id} to the driver.
              </span>
            </div>
          )}

          {phase === "approved" && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 animate-[pop-in_0.5s_ease-out] text-success" />
              <span className="text-[16px] font-semibold text-text-primary">
                Ticket approved — you&apos;re on board
              </span>
              <span className="text-[12px] text-text-secondary">Starting your trip…</span>
            </div>
          )}
        </div>
      </div>

      {showCallModal && (
        <Modal onClose={() => setShowCallModal(false)}>
          <div className="flex flex-col items-center gap-3 px-6 pb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <span className="text-[16px] font-semibold text-text-primary">{DRIVER_NAME}</span>
            <span className="text-[13px] text-text-secondary">Driver · {companyName}</span>
            <span className="font-mono text-2xl font-bold text-text-primary">{DRIVER_PHONE}</span>
            <div className="mt-2 flex w-full flex-col gap-2">
              <Button
                onClick={() => {
                  // Hands off to the phone dialer rather than opening a tab.
                  window.location.href = `tel:${DRIVER_PHONE}`;
                }}
                icon={<Phone className="h-5 w-5" />}
              >
                Call Now
              </Button>
              <Button variant="ghost" onClick={() => setShowCallModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showChatModal && (
        <Modal onClose={() => setShowChatModal(false)}>
          <div className="flex h-[60vh] flex-col">
            <div className="flex items-center gap-3 border-b border-border px-5 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                <span className="text-[14px] font-extrabold text-primary">
                  {DRIVER_NAME.charAt(0)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-text-primary">{DRIVER_NAME}</span>
                <span className="text-[12px] text-text-secondary">Driver · {companyName}</span>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-4">
              {messages.length === 0 && (
                <p className="py-8 text-center text-[13px] text-text-muted">
                  Send your driver a message about your pickup.
                </p>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[14px] ${
                    message.from === "you"
                      ? "self-end bg-primary text-white"
                      : "self-start bg-surface text-text-primary"
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-border px-5 py-3 pb-5">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message…"
                className="h-11 flex-1 rounded-pill border border-border bg-surface px-4 text-[14px] text-text-primary outline-none placeholder:text-text-muted focus:border-primary"
              />
              <button
                onClick={sendMessage}
                disabled={!draft.trim()}
                aria-label="Send message"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-40"
              >
                <Send className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showCancelConfirm && (
        <Modal onClose={() => setShowCancelConfirm(false)}>
          <div className="flex flex-col items-center gap-3 px-6 pb-6">
            <AlertTriangle className="h-8 w-8 text-error" />
            <h2 className="text-[16px] font-semibold text-text-primary">Cancel this booking?</h2>
            <p className="text-center text-[14px] text-text-secondary">
              This can&apos;t be undone. Your seat will be released.
            </p>
            {cancelError && <p className="text-center text-[13px] text-error">{cancelError}</p>}
            <div className="mt-2 flex w-full flex-col gap-2">
              <Button variant="outline" loading={cancelling} onClick={handleConfirmCancel}>
                Yes, cancel booking
              </Button>
              <Button variant="ghost" onClick={() => setShowCancelConfirm(false)}>
                Keep booking
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <BottomNav />
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[390px] animate-[slide-up_0.25s_ease-out] rounded-t-[28px] bg-white"
      >
        <div className="flex justify-end p-2">
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-surface"
          >
            <X className="h-3.5 w-3.5 text-text-primary" strokeWidth={3} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
