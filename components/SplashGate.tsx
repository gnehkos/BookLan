"use client";

import { useEffect, useState } from "react";
import SplashScreen from "@/components/SplashScreen";

/** How long the launch screen holds before the app takes over. */
const SPLASH_MS = 2100;
const FADE_MS = 450;

/**
 * Plays the launch screen once per page load, over whatever route was opened.
 *
 * Mounted in the root layout rather than on the entry route, so it runs on
 * every visit — including a bookmark straight to a booking, or a browser
 * restoring the last page — the way opening a real app always shows its splash.
 * Client-side navigation does not remount the layout, so moving between screens
 * inside the app never replays it.
 */
export default function SplashGate() {
  const [leaving, setLeaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const fade = setTimeout(() => setLeaving(true), SPLASH_MS);
    const finish = setTimeout(() => setDone(true), SPLASH_MS + FADE_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(finish);
    };
  }, []);

  if (done) return null;
  return <SplashScreen leaving={leaving} />;
}
