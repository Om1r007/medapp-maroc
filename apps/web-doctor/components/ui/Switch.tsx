"use client";

import { cn } from "@/lib/cn";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function Switch({ checked, onCheckedChange, disabled = false, size = "md" }: SwitchProps) {
  const s = {
    sm: { track: "w-8 h-4", thumb: "h-3 w-3", on: "translate-x-4" },
    md: { track: "w-11 h-6", thumb: "h-5 w-5", on: "translate-x-5" },
  }[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        s.track,
        checked ? "bg-primary-500" : "bg-neutral-300",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block rounded-full bg-white shadow-lg transition-transform duration-200",
          s.thumb,
          checked ? s.on : "translate-x-0",
        )}
      />
    </button>
  );
}
