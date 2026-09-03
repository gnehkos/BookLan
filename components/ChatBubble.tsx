"use client";

import { Play } from "lucide-react";
import { useRef, useState } from "react";
import { formatDuration, type ChatMessage } from "@/lib/chat";

/**
 * One message. Text and photos sit in a bubble on the sender's side; events
 * such as a finished call render centred, because they belong to neither party.
 */
export default function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.kind === "system") {
    return (
      <span className="mx-auto my-1 rounded-pill bg-surface px-3 py-1 text-[11.5px] text-text-secondary">
        {message.text}
      </span>
    );
  }

  const mine = message.from === "you";
  const side = mine ? "self-end" : "self-start";

  if (message.kind === "image" && message.media) {
    return (
      <div className={`${side} max-w-[72%] overflow-hidden rounded-2xl`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={message.media} alt="Shared photo" className="h-auto w-full object-cover" />
      </div>
    );
  }

  if (message.kind === "voice" && message.media) {
    return <VoiceBubble message={message} mine={mine} />;
  }

  return (
    <div
      className={`${side} max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[14px] ${
        mine ? "bg-primary text-white" : "bg-surface text-text-primary"
      }`}
    >
      {message.text}
    </div>
  );
}

function VoiceBubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
    } else {
      void audio.play();
      setPlaying(true);
    }
  }

  return (
    <div
      className={`${mine ? "self-end" : "self-start"} flex max-w-[72%] items-center gap-2.5 rounded-2xl px-3 py-2.5 ${
        mine ? "bg-primary text-white" : "bg-surface text-text-primary"
      }`}
    >
      <button
        onClick={toggle}
        aria-label={playing ? "Stop" : "Play voice message"}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          mine ? "bg-white/20" : "bg-white"
        }`}
      >
        {playing ? (
          <span className={`h-2.5 w-2.5 rounded-[2px] ${mine ? "bg-white" : "bg-primary"}`} />
        ) : (
          <Play className={`h-3.5 w-3.5 ${mine ? "text-white" : "text-primary"}`} />
        )}
      </button>

      {/* A static waveform: the real one would need decoding the clip, which is
          not worth the work for a fixed-height demo bar. */}
      <span className="flex flex-1 items-center gap-[3px]">
        {[6, 12, 8, 16, 10, 14, 7, 13, 9, 15, 8, 11].map((height, i) => (
          <span
            key={i}
            style={{ height }}
            className={`w-[2.5px] rounded-full ${mine ? "bg-white/60" : "bg-text-muted"}`}
          />
        ))}
      </span>

      <span className={`shrink-0 font-mono text-[11.5px] ${mine ? "text-white/75" : "text-text-secondary"}`}>
        {formatDuration(message.duration ?? 0)}
      </span>

      <audio ref={audioRef} src={message.media} onEnded={() => setPlaying(false)} hidden />
    </div>
  );
}
