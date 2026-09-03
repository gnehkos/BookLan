import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import SplashGate from "@/components/SplashGate";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

/**
 * The browser tab carries the name and the slogan; app/icon.svg supplies the
 * mark beside them. `template` keeps the name on any page that sets its own
 * title rather than replacing the branding outright.
 */
export const metadata: Metadata = {
  title: {
    default: "BookLan — No station. No waiting.",
    template: "%s · BookLan",
  },
  description:
    "Book a seat on any passing intercity bus in Cambodia. Flag one down from the roadside, or reserve a scheduled departure in advance.",
  applicationName: "BookLan",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-surface">
        {children}
        {/*
          Mounted once, above the router, so it survives navigation. Rendered
          per page it was torn down and rebuilt on every route change, and a
          CSS transition cannot animate across a remount — which is why
          switching tabs jumped instead of moving.
        */}
        <BottomNav />
        <SplashGate />
      </body>
    </html>
  );
}
