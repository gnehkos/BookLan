"use client";

import { LoaderCircle } from "lucide-react";
import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
};

/**
 * Navy is the action colour. The shadow is a restrained navy-tinted drop, not a
 * coloured glow behind the button.
 */
const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-gradient-to-b from-primary to-primary-dark text-white shadow-[0_2px_8px_rgba(16,37,68,0.18)] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:shadow-none",
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
