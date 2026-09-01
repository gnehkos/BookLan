"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, User as UserIcon } from "lucide-react";
import Button from "@/components/Button";
import { safeQuery, supabase } from "@/lib/supabase";

export default function CreateProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [name, setName] = useState("");
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
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
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
    <div className="flex min-h-screen flex-col items-center bg-white">
      <div className="flex w-full max-w-[390px] flex-1 flex-col px-6 pb-8 pt-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-text-primary">Create your profile</h1>
          <p className="text-[15px] leading-6 text-text-secondary">
            Add your name so drivers and staff know who&apos;s traveling. You can always do
            this later.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-surface"
            aria-label="Upload profile photo"
          >
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="Profile preview" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-10 w-10 text-text-secondary" />
            )}
            <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary ring-2 ring-white">
              <Camera className="h-4 w-4 text-white" />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </div>

        <div className="mt-8">
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-text-primary">
            Full name
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Dara Sok"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-14 w-full rounded-card border border-border bg-white px-4 text-[15px] text-text-primary outline-none focus:border-primary"
          />
        </div>

        {error && <p className="mt-3 text-sm text-error">{error}</p>}

        <div className="mt-auto flex flex-col gap-3 pt-8">
          <Button
            loading={saving === "continue"}
            disabled={saving !== null && saving !== "continue"}
            onClick={handleContinue}
          >
            Continue
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
