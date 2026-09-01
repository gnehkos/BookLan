"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Phone, User as UserIcon } from "lucide-react";
import Button from "@/components/Button";
import { safeQuery, supabase } from "@/lib/supabase";

const AVATAR_BUCKET = "avatars";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export default function CreateProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [name, setName] = useState("");
  // The user row doesn't exist yet, so the file is held here and uploaded once
  // we have an id to file it under.
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState<"continue" | "skip" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("booklan_phone");
    if (!stored) {
      router.replace("/auth/phone");
      return;
    }
    setPhone(stored);
  }, [router]);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_PHOTO_BYTES) {
      setError("That image is over 5MB. Please pick a smaller one.");
      return;
    }

    setError(null);
    setPhotoFile(file);
    setPhotoPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  }

  /**
   * Uploads the held photo now that the account exists, and stores the public
   * URL on the user. Best-effort: the account is already created, so a storage
   * failure must not block getting into the app.
   */
  async function uploadPhoto(userId: string) {
    if (!photoFile) return;

    const extension = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, photoFile, { contentType: photoFile.type, upsert: true });

    if (uploadError) return;

    const publicUrl = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
    await safeQuery(
      supabase.from("users").update({ profile_photo_url: publicUrl }).eq("id", userId)
    );
  }

  async function saveUser(finalName: string | null) {
    if (!phone) return;
    setError(null);

    const { data, error: upsertError } = await safeQuery(
      supabase
        .from("users")
        .upsert({ phone, name: finalName }, { onConflict: "phone" })
        .select()
        .single()
    );

    if (upsertError || !data) {
      setError(upsertError?.message ?? "Couldn't save your profile. Please try again.");
      setSaving(null);
      return;
    }

    await uploadPhoto(data.id);

    localStorage.setItem("booklan_user_id", data.id);
    localStorage.setItem("booklan_user_name", finalName ?? "");
    document.cookie = `booklan_session=${data.id}; path=/; max-age=2592000; samesite=lax`;
    router.push("/home");
  }

  async function handleContinue() {
    setSaving("continue");
    await saveUser(name.trim() || null);
  }

  async function handleSkip() {
    setSaving("skip");
    await saveUser(null);
  }

  return (
    <div className="flex min-h-screen justify-center bg-white">
      <div className="flex w-full max-w-[393px] flex-1 flex-col px-6 pb-10 pt-16">
        <h1 className="text-[30px] font-extrabold leading-[45px] tracking-[-0.8px] text-text-primary">
          Create account
        </h1>
        <p className="mt-2 text-[15px] font-medium leading-[22.5px] text-text-muted">
          Add your name so drivers know who&apos;s travelling.
        </p>

        <div className="mt-10 flex flex-col items-center">
          {/* overflow-hidden lives on the inner circle only — on the button it
              clipped the camera badge that hangs off the bottom-right. */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative h-24 w-24"
            aria-label="Upload profile photo"
          >
            <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-surface">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserIcon className="h-10 w-10 text-text-muted" />
              )}
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary ring-[3px] ring-white">
              <Camera className="h-4 w-4 text-white" />
            </span>
          </button>
          <span className="mt-3 text-[12px] text-text-muted">Profile photo (optional)</span>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </div>

        <div className="mt-10">
          <label
            htmlFor="name"
            className="mb-2.5 block text-[12px] font-bold tracking-[0.4px] text-text-secondary"
          >
            FULL NAME
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Dara Sok"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-[54px] w-full rounded-2xl border border-border bg-surface px-5 text-[15px] text-text-primary outline-none focus:border-primary"
          />
        </div>

        <div className="mt-6">
          <span className="mb-2.5 block text-[12px] font-bold tracking-[0.4px] text-text-secondary">
            PHONE NUMBER
          </span>
          {/* Read-only: it was verified on the previous step. */}
          <div className="flex h-[54px] w-full items-center gap-3 rounded-2xl border border-border bg-surface px-5">
            <Phone className="h-4 w-4 shrink-0 text-text-muted" />
            <span className="flex-1 text-[15px] font-bold text-text-primary">{phone}</span>
            <span className="text-[12px] text-text-muted">Verified</span>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-error">{error}</p>}

        <div className="mt-auto flex flex-col gap-3 pt-10">
          <Button
            loading={saving === "continue"}
            disabled={saving !== null && saving !== "continue"}
            onClick={handleContinue}
          >
            {saving === "continue" ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create account"}
          </Button>
          <Button
            variant="ghost"
            loading={saving === "skip"}
            disabled={saving !== null && saving !== "skip"}
            onClick={handleSkip}
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
