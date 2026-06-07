"use client";

import type { ReactNode } from "react";

type ThemedDateInputProps = {
  label?: ReactNode;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: ReactNode;
  helperText?: ReactNode;
  required?: boolean;
  surface?: "surface" | "background";
};

export function ThemedDateInput({
  label,
  name,
  value,
  defaultValue,
  onChange,
  disabled = false,
  error,
  helperText,
  required = false,
  surface = "surface",
}: ThemedDateInputProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-sm font-bold">{label}</span>
      )}
      <input
        name={name}
        type="date"
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        className={`min-h-12 w-full rounded-control border px-4 text-sm text-foreground outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted ${
          surface === "background" ? "bg-background" : "bg-surface"
        } ${
          error
            ? "border-expense focus:border-expense focus:ring-expense/10"
            : "border-border focus:border-accent focus:ring-accent-soft"
        }`}
      />
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
