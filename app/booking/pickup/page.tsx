"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/Button";
import BottomNav from "@/components/BottomNav";

const PickupMap = dynamic(() => import("@/components/PickupMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

export default function PickupPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("booklan_trip");
    if (!stored) {
      router.replace("/search");
      return;
    }
    setReady(true);
  }, [router]);

  function handleConfirm() {
    if (!position) return;
    sessionStorage.setItem(
      "booklan_pickup",
      JSON.stringify({ lat: position[0], lng: position[1] })
    );
    router.push("/booking/buses");
  }

  if (!ready) return null;

  return (
    <div className="flex min-h-screen flex-col items-center bg-white">
      <div className="flex w-full max-w-[390px] flex-1 flex-col pb-24">
        <div className="flex items-center gap-2 px-4 pt-6 pb-3">
          <button
            onClick={() => router.push("/search")}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface"
          >
            <ArrowLeft className="h-6 w-6 text-text-primary" />
          </button>
          <h1 className="text-lg font-bold text-text-primary">Confirm Your Pickup Location</h1>
        </div>

        <p className="px-4 pb-3 text-[13px] leading-5 text-text-secondary">
          Drag the pin to fine-tune where you&apos;ll be waiting.
        </p>

        <div className="h-[50vh] w-full">
          <PickupMap onPositionChange={setPosition} />
        </div>

        <div className="px-4 pt-4">
          <p className="text-[13px] font-medium text-text-secondary">
            {position
              ? `${position[0].toFixed(4)}, ${position[1].toFixed(4)}`
              : "Locating you…"}
          </p>
        </div>

        <div className="mt-auto px-4 pt-8">
          <Button disabled={!position} onClick={handleConfirm}>
            Confirm Pickup Location
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
