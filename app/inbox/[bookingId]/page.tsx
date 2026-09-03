"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone } from "lucide-react";
import CallScreen from "@/components/CallScreen";
import CompanyLogo from "@/components/CompanyLogo";
import ChatBubble from "@/components/ChatBubble";
import ChatComposer from "@/components/ChatComposer";
import {
  appendMessage,
  formatDuration,
  getThread,
  relativeTime,
  type ChatMessage,
  type ChatThread,
} from "@/lib/chat";
import { DRIVER_PHONE } from "@/constants/drivers";

export default function ChatThreadPage() {
  const router = useRouter();
  const params = useParams<{ bookingId: string }>();
  const bookingId = params.bookingId;

  const [thread, setThread] = useState<ChatThread | null>(null);
  const [ready, setReady] = useState(false);
  const [calling, setCalling] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setThread(getThread(bookingId));
    setReady(true);
  }, [bookingId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length]);

  function send(message: Omit<ChatMessage, "id" | "at">) {
    if (!thread) return;
    setThread(
      appendMessage(
        {
          bookingId: thread.bookingId,
          company: thread.company,
          driver: thread.driver,
          destination: thread.destination,
        },
        message
      )
    );
  }

  /** A finished call is recorded in the thread, the way a messaging app does. */
  function logCall(outcome: { connected: boolean; seconds: number }) {
    send({
      from: "you",
      kind: "system",
      text: outcome.connected
        ? `Call ended · ${formatDuration(outcome.seconds)}`
        : "Call cancelled",
    });
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
          <button
            onClick={() => setCalling(true)}
            aria-label="Call driver"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-white transition-transform active:scale-95"
          >
            <Phone className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-4 pb-32">
          {thread.messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col gap-1 ${
                message.kind === "system"
                  ? "items-center self-center"
                  : message.from === "you"
                    ? "items-end self-end"
                    : "items-start self-start"
              }`}
            >
              <ChatBubble message={message} />
              {message.kind !== "system" && (
                <span className="px-1 text-[10px] text-text-muted">
                  {relativeTime(message.at)}
                </span>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[393px] border-t border-border bg-white px-4 py-3 pb-5">
          <ChatComposer onSend={send} />
        </div>
      </div>

      {calling && (
        <CallScreen
          name={thread.driver}
          subtitle={`Driver · ${thread.company}`}
          phone={DRIVER_PHONE}
          companyName={thread.company}
          onClose={(outcome) => {
            setCalling(false);
            logCall(outcome);
          }}
        />
      )}

    </div>
  );
}
