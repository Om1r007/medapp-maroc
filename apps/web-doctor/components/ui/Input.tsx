import * as React from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  variant?: "default" | "error" | "success";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      errorMessage,
      iconLeft,
      iconRight,
      variant = "default",
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const hasError = variant === "error" || !!errorMessage;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-900"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {iconLeft}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full px-4 py-3 bg-white border rounded-lg text-base text-neutral-900 placeholder:text-neutral-400",
              "focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none",
              "disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed",
              "transition-colors duration-150",
              hasError
                ? "border-error-500 focus:border-error-500 focus:ring-error-500"
                : variant === "success"
                  ? "border-success-500 focus:border-success-500 focus:ring-success-500"
                  : "border-neutral-300",
              iconLeft && "pl-10",
              iconRight && "pr-10",
              className,
            )}
            {...props}
          />
          {iconRight && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {iconRight}
            </span>
          )}
        </div>
        {errorMessage ? (
          <p className="text-sm text-error-700">{errorMessage}</p>
        ) : helperText ? (
          <p className="text-sm text-neutral-500">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
