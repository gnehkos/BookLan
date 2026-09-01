"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, Send } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import CompanyLogo from "@/components/CompanyLogo";
import { appendMessage, getThread, relativeTime, type ChatThread } from "@/lib/chat";
import { DRIVER_PHONE } from "@/constants/drivers";

export default function ChatThreadPage() {
  const router = useRouter();
  const params = useParams<{ bookingId: string }>();
  const bookingId = params.bookingId;

  const [thread, setThread] = useState<ChatThread | null>(null);
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setThread(getThread(bookingId));
    setReady(true);
  }, [bookingId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length]);

  function send() {
    const text = draft.trim();
    if (!text || !thread) return;
    setThread(
      appendMessage(
        {
          bookingId: thread.bookingId,
          company: thread.company,
          driver: thread.driver,
          destination: thread.destination,
        },
        { from: "you", text }
      )
    );
    setDraft("");
  }

  if (!ready) return null;

  if (!thread) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-surface">
        <div className="flex w-full max-w-[393px] flex-1 flex-col px-5 pt-6">
          <button
            onClick={() => router.push("/inbox")}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white"
          >
            <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
          </button>
          <p className="py-16 text-center text-[14px] text-text-secondary">
            This conversation is no longer available.
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-surface">
      <div className="flex w-full max-w-[393px] flex-col">
        <div className="flex items-center gap-3 border-b border-border bg-white px-5 pt-6 pb-4">
          <button
            onClick={() => router.push("/inbox")}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface"
          >
            <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
          </button>
          <CompanyLogo name={thread.company} size={40} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[15px] font-bold text-text-primary">
              {thread.driver}
            </span>
            <span className="truncate text-[12px] text-text-secondary">
              {thread.company} · to {thread.destination}
            </span>
          </div>
          <a
            href={`tel:${DRIVER_PHONE}`}
            aria-label="Call driver"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent"
          >
            <Phone className="h-[18px] w-[18px] text-primary" />
          </a>
        </div>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-4 pb-32">
          {thread.messages.map((message) => (
            <div
              key={message.id}
              className={`flex max-w-[80%] flex-col gap-1 ${
                message.from === "you" ? "self-end items-end" : "self-start items-start"
              }`}
            >
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-[14px] ${
                  message.from === "you"
                    ? "bg-primary text-white"
                    : "bg-white text-text-primary"
                }`}
              >
                {message.text}
              </div>
              <span className="px-1 text-[10px] text-text-muted">
                {relativeTime(message.at)}
              </span>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[393px] border-t border-border bg-white px-5 py-3 pb-[104px]">
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message…"
              className="h-11 flex-1 rounded-pill border border-border bg-surface px-4 text-[14px] text-text-primary outline-none placeholder:text-text-muted focus:border-primary"
            />
            <button
              onClick={send}
              disabled={!draft.trim()}
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-40"
            >
              <Send className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
