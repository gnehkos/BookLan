"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Camera,
  Check,
  ChevronRight,
  Globe,
  HelpCircle,
  Loader2,
  LogOut,
  Pencil,
  Shield,
  User as UserIcon,
} from "lucide-react";
import ActiveTripBanner from "@/components/ActiveTripBanner";
import BottomNav from "@/components/BottomNav";
import { safeQuery, supabase } from "@/lib/supabase";

/** Public Supabase Storage bucket holding profile photos. */
const AVATAR_BUCKET = "avatars";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("booklan_user_id");
    if (!storedUserId) {
      router.replace("/");
      return;
    }
    setUserId(storedUserId);

    // Show the cached values immediately…
    setPhone(localStorage.getItem("booklan_phone") ?? "");
    setName(localStorage.getItem("booklan_user_name") ?? "");

    // …then treat the database as the source of truth, so the photo survives a
    // refresh instead of living only in component state.
    let cancelled = false;
    (async () => {
      const { data } = await safeQuery(
        supabase
          .from("users")
          .select("name, phone, profile_photo_url")
          .eq("id", storedUserId)
          .single()
      );

      if (cancelled || !data) return;
      setName(data.name ?? "");
      setPhone(data.phone ?? "");
      setPhotoUrl(data.profile_photo_url);
      localStorage.setItem("booklan_user_name", data.name ?? "");
      localStorage.setItem("booklan_phone", data.phone ?? "");
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Let the same file be picked again after a failed attempt.
    e.target.value = "";
    if (!file || !userId) return;

    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("That image is over 5MB. Please pick a smaller one.");
      return;
    }

    setPhotoError(null);
    setUploadingPhoto(true);

    const previousUrl = photoUrl;
    // Optimistic preview while the upload is in flight.
    const localPreview = URL.createObjectURL(file);
    setPhotoUrl(localPreview);

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      URL.revokeObjectURL(localPreview);
      setPhotoUrl(previousUrl);
      const missingBucket = /bucket|not found/i.test(uploadError.message);
      setPhotoError(
        missingBucket
          ? "Photo storage isn't set up yet. Run supabase-setup.sql in the Supabase SQL editor."
          : "Couldn't upload your photo. Please try again."
      );
      setUploadingPhoto(false);
      return;
    }

    const publicUrl = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;

    const { error: saveError } = await safeQuery(
      supabase.from("users").update({ profile_photo_url: publicUrl }).eq("id", userId)
    );

    URL.revokeObjectURL(localPreview);

    if (saveError) {
      setPhotoUrl(previousUrl);
      setPhotoError("Photo uploaded but couldn't be saved to your profile.");
      setUploadingPhoto(false);
      return;
    }

    setPhotoUrl(publicUrl);
    setUploadingPhoto(false);
  }

  function startEditingPhone() {
    setPhoneDraft(phone);
    setPhoneError(null);
    setEditingPhone(true);
  }

  async function savePhone() {
    if (!userId) return;
    const trimmed = phoneDraft.trim();
    if (trimmed.replace(/\D/g, "").length < 8) {
      setPhoneError("Enter a valid phone number.");
      return;
    }

    setSavingPhone(true);
    setPhoneError(null);

    const { error } = await safeQuery(
      supabase.from("users").update({ phone: trimmed }).eq("id", userId)
    );

    if (error) {
      // `users.phone` is unique, so a clash is the likely cause.
      setPhoneError(
        /duplicate|unique/i.test(error.message)
          ? "That number is already used by another account."
          : "Couldn't save your number. Please try again."
      );
      setSavingPhone(false);
      return;
    }

    setPhone(trimmed);
    localStorage.setItem("booklan_phone", trimmed);
    setSavingPhone(false);
    setEditingPhone(false);
  }

  function startEditingName() {
    setNameDraft(name);
    setNameError(null);
    setEditingName(true);
  }

  async function saveName() {
    if (!userId) return;
    const trimmed = nameDraft.trim();
    setSavingName(true);
    setNameError(null);

    const { error } = await safeQuery(
      supabase.from("users").update({ name: trimmed }).eq("id", userId)
    );

    if (error) {
      setNameError("Couldn't save your name. Please try again.");
      setSavingName(false);
      return;
    }

    setName(trimmed);
    localStorage.setItem("booklan_user_name", trimmed);
    setSavingName(false);
    setEditingName(false);
  }

  async function handleLogout() {
    sessionStorage.clear();
    localStorage.removeItem("booklan_user_id");
    localStorage.removeItem("booklan_user_name");
    localStorage.removeItem("booklan_phone");
    document.cookie = "booklan_session=; path=/; max-age=0";
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  if (!userId) return null;

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[390px] flex-1 flex-col bg-surface pb-32">
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-[16px] font-semibold text-text-primary">Profile</h1>
        </div>

        <div className="mx-4 flex flex-col items-center gap-3 rounded-[12px] bg-white p-4 shadow-[var(--shadow-float)]">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-surface"
            aria-label="Change profile photo"
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Your profile" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-10 w-10 text-text-muted" />
            )}

            {uploadingPhoto && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </span>
            )}

            <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary ring-2 ring-white">
              <Camera className="h-4 w-4 text-white" />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handlePhotoSelect}
          />

          {photoError && <p className="text-center text-[12px] text-error">{photoError}</p>}

          {editingName ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  className="h-10 rounded-[12px] border border-border px-3 text-[14px] text-text-primary outline-none focus:border-primary"
                />
                <button
                  onClick={saveName}
                  disabled={savingName}
                  aria-label="Save name"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
              {nameError && <p className="text-[12px] text-error">{nameError}</p>}
            </div>
          ) : (
            <button onClick={startEditingName} className="flex items-center gap-2">
              <span className="text-[16px] font-semibold text-text-primary">
                {name || "Add your name"}
              </span>
              <Pencil className="h-4 w-4 text-text-muted" />
            </button>
          )}

          {editingPhone ? (
            <div className="flex w-full flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="tel"
                  inputMode="tel"
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && savePhone()}
                  className="h-10 rounded-[12px] border border-border px-3 text-[14px] text-text-primary outline-none focus:border-primary"
                />
                <button
                  onClick={savePhone}
                  disabled={savingPhone}
                  aria-label="Save phone number"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
              {phoneError && <p className="text-center text-[12px] text-error">{phoneError}</p>}
            </div>
          ) : (
            <button onClick={startEditingPhone} className="flex items-center gap-2">
              <span className="text-[12px] text-text-secondary">
                {phone || "Add your phone number"}
              </span>
              <Pencil className="h-3.5 w-3.5 text-text-muted" />
            </button>
          )}
        </div>

        <SectionLabel>Preferences</SectionLabel>
        <div className="mx-4 flex flex-col gap-3">
          <SettingsRow
            icon={<Bell className="h-5 w-5" />}
            label="Notifications"
            trailing={
              <Toggle checked={notifications} onChange={() => setNotifications((v) => !v)} />
            }
          />
          <SettingsRow
            icon={<Globe className="h-5 w-5" />}
            label="Language"
            trailing={<span className="text-[12px] text-text-secondary">English</span>}
          />
        </div>

        <SectionLabel>Support</SectionLabel>
        <div className="mx-4 flex flex-col gap-3">
          <SettingsRow
            icon={<HelpCircle className="h-5 w-5" />}
            label="Help and Support"
            href="mailto:support@booklan.app"
          />
          <SettingsRow icon={<Shield className="h-5 w-5" />} label="Terms and Privacy" />
        </div>

        <div className="mt-6 px-4">
          <button
            onClick={handleLogout}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] border border-error bg-white text-[14px] font-semibold text-error hover:bg-error/5"
          >
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </div>
      </div>

      <ActiveTripBanner />
      <BottomNav />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    // px-4 to line up with the cards' mx-4 edge; px-5 left labels 4px adrift.
    <span className="block px-4 pt-6 pb-3 text-[12px] font-medium text-text-secondary">
      {children}
    </span>
  );
}

function SettingsRow({
  icon,
  label,
  href,
  trailing,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  trailing?: React.ReactNode;
}) {
  const content = (
    <div className="flex w-full items-center gap-3 rounded-[12px] bg-white p-4 shadow-[var(--shadow-float)]">
      <span className="text-text-secondary">{icon}</span>
      <span className="flex-1 text-left text-[14px] text-text-primary">{label}</span>
      {trailing ?? <ChevronRight className="h-5 w-5 text-text-muted" />}
    </div>
  );

  if (href) {
    return <a href={href}>{content}</a>;
  }

  return content;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      aria-pressed={checked}
      className={`flex h-6 w-11 items-center rounded-full px-0.5 transition-colors ${
        checked ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
