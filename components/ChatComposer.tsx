"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageIcon, Mic, Send, Square } from "lucide-react";
import { compressImage, formatDuration, type ChatMessage } from "@/lib/chat";

type Outgoing = Omit<ChatMessage, "id" | "at">;

/**
 * The message bar: text, a picked photo, a photo taken there and then, or a
 * voice note.
 *
 * Photos and recordings are stored inline as data URLs, because threads live in
 * localStorage rather than in a table — see lib/chat.ts. Pictures are shrunk
 * before storing for the same reason.
 *
 * The camera button differs from the gallery one only by the `capture`
 * attribute, which is what asks a phone to open its camera directly rather than
 * the photo picker. On a desktop browser it degrades to an ordinary file
 * dialog, which is the right fallback.
 */
export default function ChatComposer({ onSend }: { onSend: (message: Outgoing) => void }) {
  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const galleryRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  // Release the microphone if the screen closes mid-recording.
  useEffect(() => {
    return () => {
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function sendText() {
    const text = draft.trim();
    if (!text) return;
    onSend({ from: "you", kind: "text", text });
    setDraft("");
  }

  async function sendPhoto(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const media = await compressImage(file);
      onSend({ from: "you", kind: "image", text: "Photo", media });
    } catch {
      setError("Couldn't attach that photo.");
    }
  }

  async function toggleRecording() {
    setError(null);

    if (recording) {
      recorderRef.current?.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice messages aren't supported on this device.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      const startedAt = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        setSeconds(0);

        const length = Math.round((Date.now() - startedAt) / 1000);
        // Anything this short is a mis-tap, not a message.
        if (length < 1) return;

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const reader = new FileReader();
        reader.onload = () =>
          onSend({
            from: "you",
            kind: "voice",
            text: "Voice message",
            media: reader.result as string,
            duration: length,
          });
        reader.readAsDataURL(blob);
      };

      recorderRef.current = recorder;
      recorder.start();
      setSeconds(0);
      setRecording(true);
    } catch {
      setError("Microphone permission was declined.");
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {error && <p className="px-1 text-[11.5px] text-error">{error}</p>}

      <div className="flex items-center gap-2">
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void sendPhoto(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            void sendPhoto(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        {recording ? (
          <div className="flex h-11 flex-1 items-center gap-2.5 rounded-pill bg-error/10 px-4">
            <span className="h-2 w-2 animate-pulse rounded-full bg-error" />
            <span className="flex-1 text-[13px] font-semibold text-error">Recording…</span>
            <span className="font-mono text-[13px] text-error">{formatDuration(seconds)}</span>
          </div>
        ) : (
          <>
            <button
              onClick={() => galleryRef.current?.click()}
              aria-label="Send a photo"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-text-secondary transition-colors hover:bg-border"
            >
              <ImageIcon className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={() => cameraRef.current?.click()}
              aria-label="Take a photo"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-text-secondary transition-colors hover:bg-border"
            >
              <Camera className="h-[18px] w-[18px]" />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText()}
              placeholder="Type a message…"
              className="h-11 min-w-0 flex-1 rounded-pill border border-border bg-surface px-4 text-[14px] text-text-primary outline-none placeholder:text-text-muted focus:border-primary"
            />
          </>
        )}

        {draft.trim() && !recording ? (
          <button
            onClick={sendText}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white"
          >
            <Send className="h-[18px] w-[18px]" />
          </button>
        ) : (
          <button
            onClick={toggleRecording}
            aria-label={recording ? "Stop recording" : "Record a voice message"}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
              recording ? "bg-error text-white" : "bg-primary text-white"
            }`}
          >
            {recording ? (
              <Square className="h-4 w-4 fill-current" />
            ) : (
              <Mic className="h-[18px] w-[18px]" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
