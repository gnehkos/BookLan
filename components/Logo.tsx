import { Bus } from "lucide-react";

export default function Logo({ size = "lg" }: { size?: "lg" | "sm" }) {
  const box = size === "lg" ? "h-16 w-16 rounded-2xl" : "h-10 w-10 rounded-xl";
  const icon = size === "lg" ? "h-8 w-8" : "h-5 w-5";
  const text = size === "lg" ? "text-2xl" : "text-lg";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`flex items-center justify-center bg-primary ${box}`}>
        <Bus className={`${icon} text-white`} strokeWidth={2.25} />
      </div>
      <span className={`font-bold text-primary ${text}`}>BookLan</span>
    </div>
  );
}
