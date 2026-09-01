"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";

/**
 * A full-screen in-app call, in the shape of a messaging app's call UI.
 *
 * The call is simulated: BookLan carries no telephony, and handing off to the
 * device dialer would drop the passenger out of the app mid-pickup, which is
 * exactly when they least want to lose the tracking screen. So the number is
 * shown, the call connects after a short ring, and the controls are local.
 */
export default function CallScreen({
  name,
  subtitle,
  phone,
  companyName,
  onClose,
}: {
  name: string;
  subtitle: string;
  phone: string;
  companyName: string;
  onClose: () => void;
}) {
  const [connected, setConnected] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);

  // Ring, then connect.
  useEffect(() => {
    const timer = setTimeout(() => setConnected(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!connected) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [connected]);

  const elapsed = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60
  ).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[60] flex justify-center bg-primary-dark">
      <div className="relative flex w-full max-w-[393px] flex-col items-center px-6 pb-14 pt-24">
        <div className="relative flex flex-col items-center">
          <div className="relative">
            {!connected && (
              <span className="absolute -inset-3 animate-[call-ring_1.8s_ease-out_infinite] rounded-full border-2 border-white/40" />
            )}
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white/10 ring-2 ring-white/20">
              <CompanyLogo name={companyName} size={72} />
            </div>
          </div>

          <span className="mt-6 text-[24px] font-bold tracking-[-0.4px] text-white">{name}</span>
          <span className="mt-1 text-[13px] text-white/60">{subtitle}</span>
          <span className="mt-3 font-mono text-[14px] tracking-[0.4px] text-white/45">{phone}</span>

          <span className="mt-6 text-[14px] font-medium text-white/80">
            {connected ? elapsed : "Calling…"}
          </span>
        </div>

        <div className="mt-auto flex items-center gap-5">
          <button
            onClick={() => setMuted((value) => !value)}
            aria-label={muted ? "Unmute" : "Mute"}
            aria-pressed={muted}
            className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
              muted ? "bg-white text-primary" : "bg-white/12 text-white hover:bg-white/20"
            }`}
          >
            {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <button
            onClick={onClose}
            aria-label="End call"
            className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-error text-white transition-transform active:scale-95"
          >
            <PhoneOff className="h-6 w-6" />
          </button>

          <button
            onClick={() => setSpeaker((value) => !value)}
            aria-label={speaker ? "Speaker off" : "Speaker on"}
            aria-pressed={speaker}
            className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
              speaker ? "bg-white text-primary" : "bg-white/12 text-white hover:bg-white/20"
            }`}
          >
            {speaker ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
