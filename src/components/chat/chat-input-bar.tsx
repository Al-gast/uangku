"use client";

import type { FormEvent, RefObject } from "react";

type ChatInputBarProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function ChatInputBar({
  inputRef,
  value,
  disabled,
  onChange,
  onSubmit,
}: ChatInputBarProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      onSubmit={submit}
      className="flex gap-2 border-t border-border bg-surface py-3 shadow-[0_-4px_16px_var(--overlay)]"
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        autoComplete="off"
        placeholder={'Ketik transaksi, cth: "makan 25k"'}
        className="min-h-12 min-w-0 flex-1 rounded-control border border-border bg-background px-4 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Kirim transaksi"
        className="grid size-12 shrink-0 place-items-center rounded-control bg-accent text-lg font-bold text-accent-foreground transition hover:bg-accent-strong active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
      >
        ➤
      </button>
    </form>
  );
}
