"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Ban, MessageCircle, Phone, Ticket, X } from "lucide-react";
import Button from "@/components/Button";
import BottomNav from "@/components/BottomNav";
import ErrorState from "@/components/ErrorState";
import { safeQuery, supabase } from "@/lib/supabase";

const TrackingMap = dynamic(() => import("@/components/TrackingMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

// Demo contact number — the schema has no driver/company phone column yet.
const DRIVER_PHONE = "+85512345678";

type VehicleType = "bus" | "van";

type BookingRow = {
  id: string;
  ticket_id: string;
  seat_number: number;
  pickup_lat: number;
  pickup_lng: number;
  distance_remaining_km: number;
  status: string;
  active_trips: { distance_km: number; companies: { name: string; vehicle_type: VehicleType } | null } | null;
};

export default function TrackingPage() {
  const router = useRouter();
  const params = useParams<{ bookingId: string }>();
  const bookingId = params.bookingId;

  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
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
            "id, ticket_id, seat_number, pickup_lat, pickup_lng, distance_remaining_km, status, active_trips(distance_km, companies(name, vehicle_type))"
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

  useEffect(() => {
    if (distance === null || distance <= 0) return;

    const interval = setInterval(async () => {
      const current = distanceRef.current;
      if (current === null || current <= 0) return;

      const drop = Math.floor(Math.random() * 3) + 1;
      const next = Math.max(0, current - drop);
      setDistance(next);
      await supabase.from("bookings").update({ distance_remaining_km: next }).eq("id", bookingId);
    }, 30000);

    return () => clearInterval(interval);
  }, [bookingId, distance]);

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

    router.push("/home");
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

  const arrived = distance <= 0;
  const whatsappHref = `https://wa.me/${DRIVER_PHONE.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hi, I'm waiting for pickup — ticket ${booking.ticket_id}`
  )}`;

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[390px] flex-1 flex-col bg-surface pb-24">
        <div className="flex items-center gap-2 bg-white px-4 pt-6 pb-4">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface"
          >
            <ArrowLeft className="h-6 w-6 text-text-primary" />
          </button>
          <h1 className="text-lg font-bold text-text-primary">
            {booking.active_trips?.companies?.name ?? "Your bus"}
          </h1>
        </div>

        {arrived ? (
          <div className="mx-4 mt-4 rounded-card bg-success/10 px-4 py-3 text-center text-[15px] font-semibold text-success">
            Your bus has arrived!
          </div>
        ) : (
          <div className="mx-4 mt-4 flex items-center justify-between rounded-card bg-white px-4 py-3 shadow-sm">
            <span className="text-[14px] text-text-secondary">Bus distance</span>
            <span className="text-xl font-bold text-primary">{distance} km away</span>
          </div>
        )}

        <div className="mt-4 h-[35vh] w-full">
          <TrackingMap lat={booking.pickup_lat} lng={booking.pickup_lng} />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 px-4">
          <ActionButton
            icon={<Phone className="h-5 w-5" />}
            label="Call Driver"
            href={`tel:${DRIVER_PHONE}`}
          />
          <ActionButton
            icon={<MessageCircle className="h-5 w-5" />}
            label="Message"
            href={whatsappHref}
          />
          <ActionButton
            icon={<Ticket className="h-5 w-5" />}
            label="View Ticket"
            onClick={() => setShowTicket(true)}
          />
          <ActionButton
            icon={<Ban className="h-5 w-5" />}
            label="Cancel"
            onClick={() => setShowCancelConfirm(true)}
            danger
          />
        </div>

        <div className="mx-4 mt-6 flex flex-col items-center gap-1 rounded-card bg-primary px-4 py-5 text-white">
          <span className="text-[13px] text-white/70">Show this to your driver</span>
          <span className="font-mono text-2xl font-bold tracking-wide">{booking.ticket_id}</span>
        </div>
      </div>

      {showTicket && (
        <Modal onClose={() => setShowTicket(false)}>
          <div className="flex flex-col items-center gap-2 p-6">
            <Ticket className="h-8 w-8 text-primary" />
            <span className="text-[13px] text-text-secondary">Your ticket ID</span>
            <span className="font-mono text-2xl font-bold text-text-primary">
              {booking.ticket_id}
            </span>
            <span className="mt-1 text-[13px] text-text-secondary">
              Seat {booking.seat_number}
            </span>
          </div>
        </Modal>
      )}

      {showCancelConfirm && (
        <Modal onClose={() => setShowCancelConfirm(false)}>
          <div className="flex flex-col items-center gap-3 p-6">
            <AlertTriangle className="h-8 w-8 text-error" />
            <h2 className="text-lg font-bold text-text-primary">Cancel this booking?</h2>
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

function ActionButton({
  icon,
  label,
  href,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const content = (
    <div className="flex flex-col items-center gap-1.5 rounded-card bg-white py-3 shadow-sm">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          danger ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
        }`}
      >
        {icon}
      </div>
      <span className="text-center text-[11px] font-medium text-text-primary">{label}</span>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className="w-full">
      {content}
    </button>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-[390px] rounded-t-card bg-white sm:rounded-card">
        <div className="flex justify-end p-2">
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
