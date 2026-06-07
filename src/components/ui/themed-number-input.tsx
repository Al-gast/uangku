"use client";

import type { ReactNode } from "react";

type ThemedNumberInputProps = {
  label?: ReactNode;
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: ReactNode;
  helperText?: ReactNode;
  required?: boolean;
  placeholder?: string;
  prefix?: ReactNode;
  inputMode?: "numeric" | "decimal";
  min?: string | number;
  surface?: "surface" | "background";
  textSize?: "base" | "lg" | "xl";
};

const textSizeClassName = {
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
} as const;

export function ThemedNumberInput({
  label,
  name,
  value,
  defaultValue,
  onChange,
  disabled = false,
  error,
  helperText,
  required = false,
  placeholder,
  prefix,
  inputMode = "numeric",
  min,
  surface = "surface",
  textSize = "base",
}: ThemedNumberInputProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-sm font-bold">{label}</span>
      )}
      <div
        className={`flex min-h-12 items-center rounded-control border px-4 transition focus-within:ring-4 ${
          surface === "background" ? "bg-background" : "bg-surface"
        } ${
          error
            ? "border-expense focus-within:border-expense focus-within:ring-expense/10"
            : "border-border focus-within:border-accent focus-within:ring-accent-soft"
        } ${
          disabled ? "cursor-not-allowed bg-surface-muted text-muted" : ""
        }`}
      >
        {prefix && (
          <span className="mr-2 shrink-0 font-bold text-muted">
            {prefix}
          </span>
        )}
        <input
          name={name}
          type="text"
          inputMode={inputMode}
          value={value}
          defaultValue={defaultValue}
          onChange={(event) => onChange?.(event.target.value)}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          min={min}
          aria-invalid={Boolean(error)}
          className={`min-w-0 flex-1 bg-transparent text-right font-bold text-foreground outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:text-muted ${textSizeClassName[textSize]}`}
        />
      </div>
      {(error || helperText) && (
        <p
          className={`mt-2 text-xs leading-5 ${
            error ? "text-expense" : "text-muted"
          }`}
        >
          {error ?? helperText}
        </p>
      )}
    </label>
  );
}
