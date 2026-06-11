"use client";

import type { FormEvent, KeyboardEvent, RefObject } from "react";

type ChatInputBarProps = {
  inputRef: RefObject<HTMLTextAreaElement | null>;
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

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex gap-2 border-t border-border bg-surface py-3 shadow-[0_-4px_16px_var(--overlay)]"
    >
      <textarea
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
        rows={1}
        placeholder={'Ketik transaksi, cth: "makan 25k; kopi 18rb"'}
        className="max-h-32 min-h-12 min-w-0 flex-1 resize-none rounded-control border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft disabled:opacity-60"
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
