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
  LogOut,
  Pencil,
  Shield,
  User as UserIcon,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { safeQuery, supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("booklan_user_id");
    if (!storedUserId) {
      router.replace("/");
      return;
    }
    setUserId(storedUserId);
    setPhone(localStorage.getItem("booklan_phone") ?? "");
    setName(localStorage.getItem("booklan_user_name") ?? "");
  }, [router]);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
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
    router.push("/");
  }

  if (!userId) return null;

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[390px] flex-1 flex-col bg-surface pb-24">
        <div className="bg-white px-4 pt-6 pb-4">
          <h1 className="text-lg font-bold text-text-primary">Profile</h1>
        </div>

        <div className="flex flex-col items-center gap-3 bg-white pb-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-surface"
            aria-label="Change profile photo"
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

          {editingName ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  className="h-9 rounded-card border border-border px-3 text-[15px] text-text-primary outline-none focus:border-primary"
                />
                <button
                  onClick={saveName}
                  disabled={savingName}
                  aria-label="Save name"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
              {nameError && <p className="text-[12px] text-error">{nameError}</p>}
            </div>
          ) : (
            <button onClick={startEditingName} className="flex items-center gap-2">
              <span className="text-lg font-bold text-text-primary">{name || "Add your name"}</span>
              <Pencil className="h-4 w-4 text-text-secondary" />
            </button>
          )}

          <span className="text-[13px] text-text-muted">{phone}</span>
        </div>

        <div className="mt-6 flex flex-col gap-2.5 px-4">
          <span className="px-1 text-[12px] font-bold tracking-[0.4px] text-text-muted">
            PREFERENCES
          </span>
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
            trailing={<span className="text-[13px] text-text-secondary">English</span>}
          />
        </div>

        <div className="mt-6 flex flex-col gap-2.5 px-4">
          <span className="px-1 text-[12px] font-bold tracking-[0.4px] text-text-muted">
            SUPPORT
          </span>
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
            className="flex h-12 w-full items-center justify-center gap-2 rounded-card border border-error text-[15px] font-semibold text-error hover:bg-error/5"
          >
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
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
    <div className="flex h-14 w-full items-center gap-3 rounded-card bg-white px-4 shadow-sm">
      <span className="text-text-secondary">{icon}</span>
      <span className="flex-1 text-left text-[14px] font-medium text-text-primary">{label}</span>
      {trailing ?? <ChevronRight className="h-5 w-5 text-text-secondary" />}
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
