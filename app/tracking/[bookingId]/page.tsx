"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronDown,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Phone,
  Ticket,
  X,
} from "lucide-react";
import Button from "@/components/Button";
import CompanyLogo from "@/components/CompanyLogo";
import ErrorState from "@/components/ErrorState";
import { safeQuery, supabase } from "@/lib/supabase";
import { AVG_SPEED_KMH } from "@/constants/booking";
import { releaseTripSeats } from "@/lib/seats";
import { useMeasuredHeight } from "@/lib/useMeasuredHeight";
import { DRIVER_PHONE, driverNameFor } from "@/constants/drivers";
import ChatBubble from "@/components/ChatBubble";
import ChatComposer from "@/components/ChatComposer";
import { appendMessage, formatDuration, getThread, type ChatMessage } from "@/lib/chat";
import CallScreen from "@/components/CallScreen";
import Portal from "@/components/Portal";

const TrackingMap = dynamic(() => import("@/components/TrackingMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

type VehicleType = "bus" | "van";

/**
 * Pickup handover. In production the driver's app approves the ticket and the
 * passenger's app follows; with no driver app yet, the bus closes the distance
 * on a timer and the approval is simulated so the flow can be demonstrated.
 */
type TripPhase = "approaching" | "verifying" | "approved";

/** Starting estimate for the panel; the real height is measured on mount. */
const PANEL_HEIGHT_FALLBACK = 220;

const APPROACH_TICK_MS = 1500;
const VERIFY_MS = 2600;
const APPROVED_MS = 1400;

type BookingRow = {
  id: string;
  user_id: string;
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

/** Gap between a floating panel and the bottom of the screen. These flows
 *  hide the nav, so there is nothing else to clear. */
const SCREEN_INSET = 16;
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
  const [showDetails, setShowDetails] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [phase, setPhase] = useState<TripPhase>("approaching");
  const [panelRef, panelHeight] = useMeasuredHeight<HTMLDivElement>(PANEL_HEIGHT_FALLBACK);
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
            "id, user_id, trip_id, ticket_id, seat_numbers, pickup_lat, pickup_lng, distance_remaining_km, status, active_trips(distance_km, destination, companies(name, vehicle_type))"
          )
          .eq("id", bookingId)
          .single()
      );

      if (!cancelled) {
        const row = data as unknown as BookingRow | null;
        // The id comes from the URL, so confirm it's actually this passenger's
        // booking before rendering anyone's ticket and pickup location.
        if (fetchError || !row) {
          setLoadError("Couldn't load this booking. It may not exist.");
        } else if (row.user_id !== localStorage.getItem("booklan_user_id")) {
          setLoadError("This booking belongs to a different account.");
        } else {
          setBooking(row);
          setDistance(row.distance_remaining_km);
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

  // Pick up an existing conversation so messaging continues where the inbox
  // left off instead of starting blank each time.
  useEffect(() => {
    const existing = getThread(bookingId);
    if (existing) setMessages(existing.messages);
  }, [bookingId]);

  /**
   * This screen is only for the pickup handover. A booking that has already
   * been boarded (distance closed) or finished belongs on the trip screen —
   * without this, opening it from My Bookings replays the whole approach.
   */
  useEffect(() => {
    if (!booking || distance === null) return;
    if (booking.status === "completed" || (booking.status === "confirmed" && distance <= 0)) {
      router.replace(`/trip/${bookingId}`);
    }
    // Only on load: once the live approach reaches 0 the phase machine takes over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.id]);

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

    // The driver approving the ticket is the moment the passenger boards, so
    // stamp it now. Best-effort: a failure here must not strand the handover.
    void safeQuery(
      supabase
        .from("bookings")
        .update({ boarded_at: new Date().toISOString() })
        .eq("id", bookingId)
    );

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

  function sendMessage(message: Omit<ChatMessage, "id" | "at">) {
    const thread = appendMessage(
      {
        bookingId,
        company: companyName,
        driver: driverNameFor(bookingId),
        destination,
      },
      message
    );
    setMessages(thread.messages);
  }

  /** A finished call is recorded in the thread, the way a messaging app does. */
  function logCall(outcome: { connected: boolean; seconds: number }) {
    sendMessage({
      from: "you",
      kind: "system",
      text: outcome.connected
        ? `Call ended · ${formatDuration(outcome.seconds)}`
        : "Call cancelled",
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-white">
        <div className="w-full max-w-[390px] flex-1 px-4 pt-6 pb-24">
          <div className="h-6 w-40 animate-pulse rounded bg-surface" />
        </div>
      </div>
    );
  }

  if (loadError || !booking || distance === null) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-white">
        <div className="flex w-full max-w-[390px] flex-1 flex-col pb-24">
          <div className="flex items-center gap-2 px-4 pt-6 pb-3">
            <button
              onClick={() => router.push("/bookings")}
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
      </div>
    );
  }

  const companyName = booking.active_trips?.companies?.name ?? "Your bus";
  const vehicleType = booking.active_trips?.companies?.vehicle_type ?? "bus";
  const driverName = driverNameFor(bookingId);
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
            panelHeight={panelHeight + SCREEN_INSET + 24}
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-5">
          <button
            onClick={() => router.push("/bookings")}
            aria-label="Back"
            className="glass pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full"
          >
            <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
          </button>
        </div>

        {/* Ticket pill — what the driver checks against on arrival. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-end px-4 pt-5">
          <span className="glass inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5">
            <Ticket className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[12px] font-medium text-text-primary">
              {booking.ticket_id}
            </span>
          </span>
        </div>

        {/* Floating panel: detached from the edges and clear of the nav. */}
        <div
          ref={panelRef}
          className="glass glass-solid absolute inset-x-4 z-20 rounded-[20px] p-4"
          style={{ bottom: SCREEN_INSET }}
        >
          <div className="flex items-center gap-3">
            <CompanyLogo name={companyName} size={40} />
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
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-white transition-transform active:scale-95"
              >
                <Phone className="h-[18px] w-[18px]" />
              </button>
              <button
                onClick={() => setShowChatModal(true)}
                aria-label="Message driver"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-accent transition-transform active:scale-95"
              >
                <MessageCircle className="h-[18px] w-[18px] text-secondary-dark" />
              </button>
            </div>
          </div>

          {/* The number gets its own row rather than trailing the driver's
              name: it is what someone reaches for when they cannot find the
              bus, and it was previously the smallest text on the panel. */}
          <div className="mt-3 flex items-center gap-3 rounded-[14px] bg-surface px-3 py-2.5">
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[10px] font-bold tracking-[0.4px] text-text-muted">
                YOUR DRIVER
              </span>
              <span className="truncate text-[13px] font-bold text-text-primary">
                {driverName}
              </span>
            </span>
            {/* The number itself places a real call through the device's dialer.
                The round button beside the driver's name is the in-app call. */}
            <a
              href={`tel:${DRIVER_PHONE}`}
              className="shrink-0 font-mono text-[14px] font-bold tracking-[0.3px] text-primary underline decoration-primary/30 underline-offset-4"
            >
              {DRIVER_PHONE}
            </a>
          </div>

          {/* Everything else about the vehicle, folded away until asked for. */}
          <button
            onClick={() => setShowDetails((open) => !open)}
            aria-expanded={showDetails}
            className="mt-2 flex w-full items-center justify-between rounded-[12px] px-1 py-1.5 text-left"
          >
            <span className="text-[12px] font-bold text-text-secondary">Trip details</span>
            <ChevronDown
              className={`h-4 w-4 text-text-muted transition-transform duration-200 ${
                showDetails ? "rotate-180" : ""
              }`}
            />
          </button>

          {showDetails && (
            <div className="mb-1 grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-[14px] bg-surface p-3">
              <Detail label="Ticket ID" value={booking.ticket_id} mono />
              <Detail label="Operator" value={companyName} />
              <Detail label="Vehicle" value={vehicleType} capitalize />
              <Detail
                label={booking.seat_numbers.length > 1 ? "Seats" : "Seat"}
                value={booking.seat_numbers.join(", ")}
              />
              <Detail label="Destination" value={destination} />
              <Detail label="Distance left" value={`${distance} km`} />
            </div>
          )}

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
        <Portal>
          <CallScreen
          name={driverName}
          subtitle={`Driver · ${companyName}`}
          phone={DRIVER_PHONE}
          companyName={companyName}
            onClose={(outcome) => {
            setShowCallModal(false);
            logCall(outcome);
          }}
          />
        </Portal>
      )}

      {showChatModal && (
        <Portal>
          <Modal onClose={() => setShowChatModal(false)}>
          <div className="flex h-[60vh] flex-col">
            <div className="flex items-center gap-3 border-b border-border px-5 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                <span className="text-[14px] font-extrabold text-primary">
                  {driverName.charAt(0)}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px] font-bold text-text-primary">
                  {driverName}
                </span>
                <span className="truncate text-[12px] text-text-secondary">
                  Driver · {companyName}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowChatModal(false);
                  setShowCallModal(true);
                }}
                aria-label="Call driver"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-white transition-transform active:scale-95"
              >
                <Phone className="h-[17px] w-[17px]" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-4">
              {messages.length === 0 && (
                <p className="py-8 text-center text-[13px] text-text-muted">
                  Send your driver a message about your pickup.
                </p>
              )}
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
            </div>

            <div className="border-t border-border px-4 py-3 pb-5">
              <ChatComposer onSend={sendMessage} />
            </div>
          </div>
          </Modal>
        </Portal>
      )}

      {showCancelConfirm && (
        <Portal>
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
        </Portal>
      )}

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

function Detail({
  label,
  value,
  mono = false,
  capitalize = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-[9.5px] font-bold tracking-[0.4px] text-text-muted">
        {label.toUpperCase()}
      </span>
      <span
        className={`truncate text-[12.5px] font-semibold text-text-primary ${
          mono ? "font-mono" : ""
        } ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
