"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, MapPin } from "lucide-react";
import Button from "@/components/Button";
import CompanyLogo from "@/components/CompanyLogo";
import ErrorState from "@/components/ErrorState";
import { safeQuery, supabase } from "@/lib/supabase";

const StationMap = dynamic(() => import("@/components/StationMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

type Station = {
  id: string;
  name: string;
  address: string;
  province: string;
  lat: number;
  lng: number;
};

type StoredSchedule = {
  id: string;
  origin: string;
  destination: string;
  companies: { name: string } | null;
};

/**
 * Choose which of the operator's depots to board at.
 *
 * The mirror of the drop-off step, and deliberately the same screen: operators
 * run several depots in Phnom Penh, and booking a seat days ahead is no use if
 * the passenger turns up at the wrong one. Stations are filtered to this
 * schedule's company and *origin* province.
 */
export default function AdvancedDeparturePage() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<StoredSchedule | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const scheduleStored = sessionStorage.getItem("booklan_schedule");
    if (!scheduleStored) {
      router.replace("/advanced");
      return;
    }

    const parsed = JSON.parse(scheduleStored) as StoredSchedule;
    // Seats come first: without them there is nothing to board.
    if (!sessionStorage.getItem("booklan_advanced_seat")) {
      router.replace(`/advanced/seats/${parsed.id}`);
      return;
    }

    setSchedule(parsed);
  }, [router]);

  useEffect(() => {
    if (!schedule) return;
    let cancelled = false;

    async function loadStations(scheduleId: string) {
      setLoading(true);
      setError(null);

      const { data: row, error: scheduleError } = await safeQuery(
        supabase.from("schedules").select("company_id, origin").eq("id", scheduleId).single()
      );

      if (cancelled) return;

      if (scheduleError || !row) {
        setError("Couldn't load departure stations for this service.");
        setLoading(false);
        return;
      }

      const { data, error: stationsError } = await safeQuery(
        supabase
          .from("stations")
          .select("id, name, address, province, lat, lng")
          .eq("company_id", row.company_id)
          .eq("province", row.origin)
      );

      if (cancelled) return;

      if (stationsError) {
        setError("Couldn't load drop-off stations. Check your connection and try again.");
      } else {
        setStations((data as Station[]) ?? []);
      }
      setLoading(false);
    }

    loadStations(schedule.id);
    return () => {
      cancelled = true;
    };
  }, [schedule, refreshKey]);

  function handleConfirm() {
    const station = stations.find((s) => s.id === selectedId);
    if (!station) return;

    sessionStorage.setItem(
      "booklan_advanced_departure",
      JSON.stringify({ id: station.id, name: station.name, address: station.address })
    );
    router.push("/advanced/dropoff");
  }

  if (!schedule) return null;

  const company = schedule.companies?.name ?? "This operator";

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[393px] flex-1 flex-col pb-28">
        <div className="flex items-center gap-3 px-4 pb-4 pt-6">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-[var(--shadow-soft)]"
          >
            <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
          </button>
          <div className="flex min-w-0 flex-col">
            <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-text-primary">
              Departure station
            </h1>
            <span className="truncate text-[12px] text-text-secondary">
              {company} in {schedule.origin}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4">
          {loading && (
            <>
              <div className="h-[168px] w-full animate-pulse rounded-card bg-white" />
              <div className="h-[168px] w-full animate-pulse rounded-card bg-white" />
            </>
          )}

          {!loading && error && (
            <ErrorState message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
          )}

          {!loading && !error && stations.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-card bg-white px-6 py-12 text-center shadow-[var(--shadow-soft)]">
              <MapPin className="h-6 w-6 text-text-muted" />
              <span className="text-[14px] font-semibold text-text-primary">
                No stations listed
              </span>
              <span className="text-[12.5px] leading-[19px] text-text-secondary">
                {company} has no departure depot registered in {schedule.origin} yet. Go back and
                choose another service.
              </span>
            </div>
          )}

          {!loading &&
            !error &&
            stations.map((station) => {
              const selected = selectedId === station.id;
              return (
                <button
                  key={station.id}
                  onClick={() => setSelectedId(station.id)}
                  aria-pressed={selected}
                  className={`flex flex-col overflow-hidden rounded-card bg-white text-left transition-all ${
                    selected
                      ? "ring-2 ring-primary shadow-[var(--shadow-float)]"
                      : "ring-1 ring-border shadow-[var(--shadow-soft)]"
                  }`}
                >
                  <div className="relative h-28 w-full">
                    <StationMap lat={station.lat} lng={station.lng} />
                    {selected && (
                      <span className="absolute right-3 top-3 z-[500] flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-[var(--shadow-soft)]">
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 p-4">
                    <CompanyLogo name={company} size={36} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[15px] font-bold text-text-primary">
                        {station.name}
                      </span>
                      <span className="truncate text-[12.5px] text-text-secondary">
                        {station.address}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
        </div>

        {selectedId && (
          // Fixed rather than sticky: with only one or two stations the list is
          // shorter than the screen, and a sticky element then sits wherever
          // the content happens to end — halfway up.
          <div className="fixed inset-x-0 bottom-4 z-20 mx-auto w-full max-w-[393px] px-4">
            <Button onClick={handleConfirm}>Confirm drop-off</Button>
          </div>
        )}
      </div>
    </div>
  );
}
