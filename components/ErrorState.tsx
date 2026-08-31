"use client";

import { AlertCircle } from "lucide-react";

export default function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <AlertCircle className="h-8 w-8 text-error" />
      <p className="text-[14px] text-text-secondary">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-[13px] font-semibold text-primary">
          Try again
        </button>
      )}
    </div>
  );
}
