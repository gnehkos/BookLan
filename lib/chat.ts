"use client";

/**
 * Passenger ↔ driver chat, stored in localStorage.
 *
 * There is no messages table in the schema and no driver app to reply from, so
 * threads live on the device: the tracking screen writes to them and the inbox
 * reads them back. Swap this module for a `messages` table when a real driver
 * app exists — the shape below is deliberately close to what a row would hold.
 */
const STORAGE_KEY = "booklan_chats";

/**
 * `system` covers events rather than speech — a call ending, for instance —
 * and renders centred rather than as a bubble.
 */
export type ChatMessageKind = "text" | "image" | "voice" | "system";

export type ChatMessage = {
  id: number;
  from: "you" | "driver";
  text: string;
  at: number;
  kind?: ChatMessageKind;
  /** Data URL for an image or a recording. Stored inline, see compressImage. */
  media?: string;
  /** Recording length in seconds, for voice notes. */
  duration?: number;
};

/** What the inbox shows as a thread's last line. */
export function previewText(message: ChatMessage | null) {
  if (!message) return "";
  if (message.kind === "image") return "Photo";
  if (message.kind === "voice") return `Voice message · ${formatDuration(message.duration ?? 0)}`;
  return message.text;
}

export function formatDuration(seconds: number) {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * Shrinks a picked photo before it is stored.
 *
 * Threads live in localStorage, which holds a few megabytes in total — a single
 * modern phone photo would fill it and start throwing on every later write. The
 * long edge is capped and the result re-encoded as JPEG.
 */
export function compressImage(file: File, maxEdge = 900, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not read that image."));
      image.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Could not process that image."));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export type ChatThread = {
  bookingId: string;
  company: string;
  driver: string;
  destination: string;
  messages: ChatMessage[];
};

function readAll(): Record<string, ChatThread> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeAll(threads: Record<string, ChatThread>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch {
    // Private mode or full storage — chat simply won't persist.
  }
}

/** Newest-first, and only threads that actually have messages. */
export function listThreads(): ChatThread[] {
  return Object.values(readAll())
    .filter((thread) => thread.messages.length > 0)
    .sort((a, b) => lastAt(b) - lastAt(a));
}

export function getThread(bookingId: string): ChatThread | null {
  return readAll()[bookingId] ?? null;
}

export function lastAt(thread: ChatThread) {
  return thread.messages[thread.messages.length - 1]?.at ?? 0;
}

export function lastMessage(thread: ChatThread) {
  return thread.messages[thread.messages.length - 1] ?? null;
}

export function appendMessage(
  meta: Omit<ChatThread, "messages">,
  message: Omit<ChatMessage, "id" | "at">
): ChatThread {
  const threads = readAll();
  const existing = threads[meta.bookingId];
  const thread: ChatThread = existing
    ? { ...existing, ...meta, messages: existing.messages }
    : { ...meta, messages: [] };

  thread.messages = [
    ...thread.messages,
    { kind: "text", ...message, id: Date.now(), at: Date.now() },
  ];
  threads[meta.bookingId] = thread;
  writeAll(threads);
  return thread;
}

/** "2 min ago" / "3 days ago", matching the inbox timestamps. */
export function relativeTime(timestamp: number) {
  const seconds = Math.max(1, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "just now";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
}
