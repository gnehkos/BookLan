"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronUp, MapPin, Star, X } from "lucide-react";
import Button from "@/components/Button";
import { NAV_CLEARANCE } from "@/components/BottomNav";
import CompanyLogo from "@/components/CompanyLogo";
import CompanyPhotos from "@/components/CompanyPhotos";
import ErrorState from "@/components/ErrorState";
import SeatMap from "@/components/SeatMap";
import VehicleBadge from "@/components/VehicleBadge";
import { safeQuery, supabase } from "@/lib/supabase";
import { SERVICE_FEE_USD } from "@/constants/booking";
import { companyProfile } from "@/constants/companyProfile";

type VehicleType = "bus" | "van";

type TripDetail = {
  id: string;
  company_id: string;
  origin: string;
  destination: string;
  distance_km: number;
  price_per_km: number;
  seats_total: number;
  seats_available: number;
  companies: { name: string; vehicle_type: VehicleType } | null;
};

type StoredPickup = { lat: number; lng: number; stationName?: string; placeName?: string };

type Review = { id: string; rating: number; comment: string | null; users: { name: string | null } | null };

/** Height of the sticky bottom panel, so scrolled content never hides under it. */
const ACTION_BAR_HEIGHT = 150;

export default function BusDetailPage() {
  const router = useRouter();
  const params = useParams<{ tripId: string }>();
  const tripId = params.tripId;

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [pickup, setPickup] = useState<StoredPickup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [allReviews, setAllReviews] = useState(false);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem("booklan_pickup");
    if (stored) setPickup(JSON.parse(stored));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTrip() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await safeQuery(
        supabase
          .from("active_trips")
          .select(
            "id, company_id, origin, destination, distance_km, price_per_km, seats_total, seats_available, companies(name, vehicle_type)"
          )
          .eq("id", tripId)
          .single()
      );

      if (!cancelled) {
        if (fetchError || !data) {
          setError("Couldn't load this trip. It may no longer be available.");
        } else {
          setTrip(data as unknown as TripDetail);
        }
        setLoading(false);
      }
    }

    loadTrip();
    return () => {
      cancelled = true;
    };
  }, [tripId, refreshKey]);

  // Real passenger reviews, once any exist for this company.
  useEffect(() => {
    if (!trip?.company_id) return;
    let cancelled = false;

    (async () => {
      const { data } = await safeQuery(
        supabase
          .from("reviews")
          .select("id, rating, comment, users(name)")
          .eq("company_id", trip.company_id)
          .order("created_at", { ascending: false })
      );
      if (!cancelled) setReviews((data as unknown as Review[]) ?? []);
    })();

    return () => {
      cancelled = true;
    };
  }, [trip?.company_id]);

  const companyName = trip?.companies?.name ?? "Unknown company";
  const vehicleType = trip?.companies?.vehicle_type ?? "bus";
  const profile = companyProfile(companyName);

  const pricePerSeat = trip ? trip.distance_km * trip.price_per_km : 0;
  const totalPrice = pricePerSeat * selectedSeats.length + SERVICE_FEE_USD;

  function toggleSeat(seat: number) {
    setSelectedSeats((current) => {
      if (current.includes(seat)) return current.filter((s) => s !== seat);
      if (!trip || current.length >= trip.seats_available) return current;
      return [...current, seat].sort((a, b) => a - b);
    });
  }

  function handleConfirmSeats() {
    if (selectedSeats.length === 0) return;
    sessionStorage.setItem(
      "booklan_seat",
      JSON.stringify({ seatNumbers: selectedSeats, totalPrice })
    );
    router.push(`/booking/${tripId}/dropoff`);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-surface">
        <div className="w-full max-w-[390px] flex-1 px-4 pt-6">
          <div className="h-6 w-40 animate-pulse rounded bg-white" />
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-surface">
        <div className="flex w-full max-w-[390px] flex-1 flex-col">
          <div className="flex items-center gap-2 px-4 pt-6 pb-3">
            <button
              onClick={() => router.back()}
              aria-label="Back"
              className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white"
            >
              <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
            </button>
          </div>
          <ErrorState
            message={error ?? "Couldn't load this trip."}
            onRetry={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      </div>
    );
  }

  // With real reviews in the database, the headline star has to be their
  // average — showing a stable made-up 4.7 above a list averaging 4.1 reads as
  // broken. Falls back to the generated profile when a company has none yet.
  const ratingValue =
    reviews && reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : profile.rating;
  const ratingNote =
    reviews && reviews.length > 0
      ? `${reviews.length} review${reviews.length > 1 ? "s" : ""}`
      : `${profile.tripCount} trips`;

  const reviewList =
    reviews && reviews.length > 0
      ? reviews.map((r) => ({
          author: r.users?.name || "Passenger",
          stars: r.rating,
          text: r.comment || "Rated this trip.",
        }))
      : profile.reviews;

  return (
    <div className="flex min-h-screen justify-center bg-surface">
      <div className="relative flex w-full max-w-[390px] flex-col">
        <div className="flex items-center gap-3 px-4 pb-4 pt-6">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white shadow-[var(--shadow-float)]"
          >
            <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
          </button>
          <div className="flex min-w-0 flex-1 flex-col">
            <h1 className="truncate text-[16px] font-semibold text-text-primary">Select seats</h1>
            <span className="truncate text-[12px] text-text-secondary">
              {trip.origin} → {trip.destination}
            </span>
          </div>
          <span className="shrink-0 rounded-pill bg-accent px-3 py-1.5 text-[12px] font-semibold text-primary">
            {trip.seats_available} left
          </span>
        </div>

        {/*
          Seat selection is the page now. It used to be a sheet behind a button
          while the company profile filled the screen, and testers did not find
          it — the profile is the secondary thing here, so it moved into the
          panel at the bottom instead.
        */}
        <div
          className="flex flex-col gap-4 overflow-y-auto px-4"
          style={{ paddingBottom: ACTION_BAR_HEIGHT + NAV_CLEARANCE }}
        >
          <Card>
            <SeatMap
              seatsTotal={trip.seats_total}
              seatsAvailable={trip.seats_available}
              selectedSeats={selectedSeats}
              onToggle={toggleSeat}
              seedKey={tripId}
            />
          </Card>
        </div>

        {/* Sticky panel: the operator row opens the full profile, the row
            below it carries the fare and the confirm. Lifted clear of the nav
            rather than sitting flush against it. */}
        <div
          className="fixed inset-x-0 z-20 mx-auto w-full max-w-[390px] px-4"
          style={{ bottom: NAV_CLEARANCE + 10 }}
        >
          <div className="overflow-hidden rounded-[20px] border border-border bg-white shadow-[var(--shadow-lift)]">
            <button
              onClick={() => setDetailsOpen(true)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface"
            >
              <CompanyLogo name={companyName} size={36} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[14px] font-bold leading-tight text-text-primary">
                  {companyName}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-[11.5px] leading-tight text-text-secondary">
                  <Star className="h-3 w-3 shrink-0 fill-warning text-warning" />
                  {ratingValue} · {ratingNote}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1 rounded-pill bg-surface px-2.5 py-1.5 text-[11px] font-bold text-primary">
                Details
                <ChevronUp className="h-3 w-3" strokeWidth={3} />
              </span>
            </button>

            <div className="h-px bg-border" />

            <div className="flex items-center gap-3 px-4 py-3">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[11.5px] leading-tight text-text-secondary">
                  {selectedSeats.length > 0
                    ? `Seat${selectedSeats.length > 1 ? "s" : ""} ${selectedSeats.join(", ")}`
                    : `$${pricePerSeat.toFixed(2)} per seat`}
                </span>
                <span className="truncate text-[19px] font-extrabold leading-tight text-text-primary">
                  {selectedSeats.length > 0 ? `$${totalPrice.toFixed(2)}` : "Choose a seat"}
                </span>
              </span>
              <span className="w-[132px] shrink-0">
                <Button disabled={selectedSeats.length === 0} onClick={handleConfirmSeats}>
                  Continue
                </Button>
              </span>
            </div>
          </div>
        </div>
      </div>

      {detailsOpen && (
        <div
          // Above the nav, or the nav paints over the sheet.
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setDetailsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[88vh] max-h-[88vh] w-full max-w-[390px] animate-[slide-up_0.25s_ease-out] flex-col rounded-t-[24px] bg-surface"
          >
            <div className="flex items-start justify-between rounded-t-[24px] bg-white px-4 pb-3 pt-4">
              <div className="flex items-center gap-3">
                <CompanyLogo name={companyName} size={40} />
                <div className="flex flex-col">
                  <h2 className="text-[16px] font-bold text-text-primary">{companyName}</h2>
                  <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    <span className="font-medium text-text-primary">{ratingValue}</span>
                    <span>· {ratingNote}</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <VehicleBadge type={vehicleType} />
                <button
                  onClick={() => setDetailsOpen(false)}
                  aria-label="Close company details"
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-surface"
                >
                  <X className="h-3.5 w-3.5 text-text-primary" strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              <Card>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-surface">
                    <MapPin className="h-4 w-4 text-text-secondary" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[12px] text-text-secondary">Pickup point</span>
                    <span className="truncate text-[14px] font-medium text-text-primary">
                      {pickup?.stationName ??
                        pickup?.placeName ??
                        (pickup
                          ? `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`
                          : "Not set yet")}
                    </span>
                  </div>
                </div>

                <div className="my-3 h-px bg-border" />

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[12px] text-text-secondary">Destination</span>
                    <span className="truncate text-[14px] font-medium text-text-primary">
                      {trip.destination}
                    </span>
                  </div>
                </div>
              </Card>

              <Card>
                <span className="text-[16px] font-semibold text-text-primary">Photos</span>
                <CompanyPhotos name={companyName} />
              </Card>

              <Card>
                <span className="text-[16px] font-semibold text-text-primary">
                  Ratings &amp; Reviews
                </span>
                <div className="mt-3 flex flex-col gap-3">
                  {(allReviews ? reviewList : reviewList.slice(0, 2)).map((review, i) => (
                    <div key={`${review.author}-${i}`} className="rounded-[12px] bg-surface p-4">
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-[14px] font-medium text-text-primary">
                          {review.author}
                        </span>
                        <span className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${
                                star < review.stars ? "fill-warning text-warning" : "text-border"
                              }`}
                            />
                          ))}
                        </span>
                      </div>
                      <p className="mt-2 text-[12px] text-text-secondary">{review.text}</p>
                    </div>
                  ))}
                </div>

                {reviewList.length > 2 && (
                  <button
                    onClick={() => setAllReviews((open) => !open)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-[12px] border border-border py-2.5 text-[13px] font-bold text-primary transition-colors hover:bg-surface"
                  >
                    {allReviews
                      ? "Show fewer"
                      : `See all ${reviewList.length} reviews`}
                    <ChevronUp
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        allReviews ? "" : "rotate-180"
                      }`}
                    />
                  </button>
                )}
              </Card>

              <Card>
                <span className="text-[16px] font-semibold text-text-primary">Policies</span>
                <ul className="mt-3 flex flex-col gap-3">
                  {profile.policies.map((policy) => (
                    <li key={policy} className="flex items-start gap-3">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary"
                        strokeWidth={2.5}
                      />
                      <span className="text-[12px] text-text-secondary">{policy}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] bg-white p-4 shadow-[var(--shadow-float)]">{children}</div>
  );
}
