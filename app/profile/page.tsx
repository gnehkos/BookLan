"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Camera,
  ChevronRight,
  Globe,
  HelpCircle,
  Loader2,
  LogOut,
  Pencil,
  Shield,
  User as UserIcon,
  X,
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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(true);

  // Name and phone are edited together in one panel rather than as two
  // separate inline fields, so there is a single explicit Save and a Cancel
  // that genuinely discards — an inline tick gave no way to back out.
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  function openEditor() {
    setNameDraft(name);
    setPhoneDraft(phone);
    setFormError(null);
    setEditing(true);
  }

  function cancelEditor() {
    // Drafts are reseeded on open, so discarding is just closing.
    setEditing(false);
    setFormError(null);
  }

  async function saveProfile() {
    if (!userId) return;

    const trimmedName = nameDraft.trim();
    const trimmedPhone = phoneDraft.trim();

    if (!trimmedName) {
      setFormError("Please enter your name.");
      return;
    }
    if (trimmedPhone.replace(/\D/g, "").length < 8) {
      setFormError("Enter a valid phone number.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const { error } = await safeQuery(
      supabase.from("users").update({ name: trimmedName, phone: trimmedPhone }).eq("id", userId)
    );

    if (error) {
      // `users.phone` is unique, so a clash is the likely cause.
      setFormError(
        /duplicate|unique/i.test(error.message)
          ? "That number is already used by another account."
          : "Couldn't save your changes. Please try again."
      );
      setSaving(false);
      return;
    }

    setName(trimmedName);
    setPhone(trimmedPhone);
    localStorage.setItem("booklan_user_name", trimmedName);
    localStorage.setItem("booklan_phone", trimmedPhone);
    setSaving(false);
    setEditing(false);
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
          {/* overflow-hidden lives on the inner circle only — on the button it
              clipped the camera badge that hangs off the bottom-right. */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="relative h-24 w-24"
            aria-label="Change profile photo"
          >
            <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-surface">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Your profile" className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-10 w-10 text-text-muted" />
              )}

              {uploadingPhoto && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </span>
              )}
            </span>

            <span className="absolute -bottom-0.5 -right-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary ring-[3px] ring-white">
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

          <div className="flex flex-col items-center">
            <span className="text-[17px] font-bold text-text-primary">
              {name || "Add your name"}
            </span>
            <span className="mt-0.5 text-[13px] text-text-secondary">
              {phone || "Add your phone number"}
            </span>
          </div>

          <button
            onClick={openEditor}
            className="mt-1 flex items-center gap-1.5 rounded-pill border border-border bg-white px-4 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-surface"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit profile
          </button>
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
            href="/support"
          />
          <SettingsRow
            icon={<Shield className="h-5 w-5" />}
            label="Terms and Privacy"
            href="/legal"
          />
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

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            aria-label="Cancel editing"
            onClick={cancelEditor}
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
          />

          <div className="relative w-full max-w-[393px] animate-[slide-up_0.28s_cubic-bezier(0.22,1,0.36,1)] rounded-t-[28px] bg-white px-5 pb-8 pt-4 shadow-[var(--shadow-lift)]">
            <span className="mx-auto mb-4 block h-1 w-10 rounded-full bg-border" />

            <div className="flex items-center justify-between">
              <h2 className="text-[19px] font-extrabold tracking-[-0.3px] text-text-primary">
                Edit profile
              </h2>
              <button
                onClick={cancelEditor}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-text-secondary"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>
            <p className="mt-1 text-[13px] text-text-secondary">
              Drivers see your name and call this number when they arrive.
            </p>

            <label
              htmlFor="edit-name"
              className="mb-2 mt-6 block text-[12px] font-bold tracking-[0.4px] text-text-secondary"
            >
              FULL NAME
            </label>
            <input
              id="edit-name"
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="e.g. Dara Sok"
              className="h-[52px] w-full rounded-2xl border border-border bg-surface px-4 text-[15px] text-text-primary outline-none focus:border-secondary"
            />

            <label
              htmlFor="edit-phone"
              className="mb-2 mt-4 block text-[12px] font-bold tracking-[0.4px] text-text-secondary"
            >
              PHONE NUMBER
            </label>
            <input
              id="edit-phone"
              type="tel"
              inputMode="tel"
              value={phoneDraft}
              onChange={(e) => setPhoneDraft(e.target.value)}
              placeholder="e.g. 012 345 678"
              className="h-[52px] w-full rounded-2xl border border-border bg-surface px-4 text-[15px] text-text-primary outline-none focus:border-secondary"
            />

            {formError && <p className="mt-3 text-[13px] text-error">{formError}</p>}

            <div className="mt-6 flex gap-3">
              <button
                onClick={cancelEditor}
                disabled={saving}
                className="h-[52px] flex-1 rounded-2xl border border-border bg-white text-[15px] font-bold text-text-secondary transition-colors hover:bg-surface disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex h-[52px] flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-secondary text-[15px] font-bold text-white shadow-[0_6px_18px_rgba(0,167,157,0.35)] transition-transform active:scale-[0.99] disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

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

  // Internal routes go through Link: a plain anchor would hard-reload the app
  // and throw away the client state, which is what made the nav feel broken.
  if (href?.startsWith("/")) {
    return <Link href={href}>{content}</Link>;
  }

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
