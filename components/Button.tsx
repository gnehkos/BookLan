"use client";

import { LoaderCircle } from "lucide-react";
import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "navy" | "outline" | "ghost";
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
};

/**
 * Teal is the action colour and navy the surface colour: heroes, headers and
 * the nav are navy, and anything that commits — pay, confirm, search — is
 * teal. `navy` stays available for a primary action sitting on a teal ground.
 */
const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-gradient-to-b from-secondary to-secondary-dark text-white shadow-[0_6px_18px_rgba(0,167,157,0.35)] hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:shadow-none",
  navy:
    "bg-gradient-to-b from-primary to-primary-dark text-white shadow-[0_6px_18px_rgba(25,53,95,0.3)] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:shadow-none",
  outline:
    "bg-white text-text-primary border border-border hover:bg-surface disabled:opacity-50",
  ghost: "bg-transparent text-text-secondary hover:bg-surface disabled:opacity-50",
};

export default function Button({
  variant = "primary",
  loading = false,
  icon,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-[16px] text-[15px] font-bold transition-all disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
